import {
  FaceRead,
} from "@dicekeys/read-dicekey-js";
import { action, makeAutoObservable } from "mobx";
import { DiceKeyFaces, DiceKeyWithoutKeyId, OrientedFace, TupleOf25Items } from "../../dicekeys/DiceKey";
import {
  FaceReadWithImageIfErrorFound,
  allDiceErrorTypes, allFacesReadHaveMajorityValues
} from "../../dicekeys/FacesRead";
import type {
  ProcessFrameResponse,
} from "../../workers/dicekey-image-frame-worker";
import {
  renderFacesRead
} from "./renderFacesRead";
import { DiceKeyMemoryStore } from "../../state";



const validateFaceRead = (faceRead: FaceRead): OrientedFace => {
  const {letter, digit, orientationAsLowercaseLetterTrbl} = faceRead;
  if (letter == null || digit == null) {
    throw new Error("Invalid face read");
  }
  return {letter, digit, orientationAsLowercaseLetterTrbl}
}

export class DiceKeyFrameProcessorState {
  facesRead?: FaceRead[];
  bestFacesRead?: FaceRead[];

  public scanningSuccessfulEnoughToTerminate: boolean = false;
  /**
   * Tracks the number of frames processed per second
   */
   public framesPerSecond: number = 0;
   public frameSize: {width: number, height: number} = ({width: 0, height: 0});
 
   /**
    * Record the times each processed frame comes back (in ms) so
    * that we can calculate the frame rate (framesPerSecond)
    */
   private frameProcessedTimesMs: number[] = [];
 
  /**
   * For tracking the time period during which the only errors in the
   * DiceKey being scanned are bit errors
   */
  private msSinceErrorsNarrowedToJustBitErrors: number | undefined;
  /**
   * Track the number of consecutive frames during which the only errors
   * in the DiceKey being scanned are bit errors.
   */
  private framesSinceErrorsNarrowedToJustBitErrors: number | undefined;

  public onFacesRead?: (facesRead: TupleOf25Items<FaceRead>) => void
  public onDiceKeyRead?: (diceKey: DiceKeyWithoutKeyId) => void

  constructor({onFacesRead, onDiceKeyRead}: {
    onFacesRead?: (facesRead: TupleOf25Items<FaceRead>) => void
    onDiceKeyRead?: (diceKey: DiceKeyWithoutKeyId) => void
  }) {
    this.onDiceKeyRead = onDiceKeyRead;
    this.onFacesRead = onFacesRead;
    makeAutoObservable(this, {
      onFacesRead: false,
      onDiceKeyRead: false,
    });
  }

  private scanningSuccessful = action ( (): true => {
    this.scanningSuccessfulEnoughToTerminate = true;
    if (this.bestFacesRead && this.onFacesRead) {
      this.onFacesRead(this.bestFacesRead as TupleOf25Items<FaceRead>)
      this.onFacesRead = undefined;
    }
    if (this.bestFacesRead && this.onDiceKeyRead) {
      const onDiceKeyReadCallback = this.onDiceKeyRead;
      this.onDiceKeyRead = undefined;
      try {
        // If the DiceKey validates, call the onDiceKeyRead callback we just removed
        const diceKey = new DiceKeyWithoutKeyId(DiceKeyFaces(this.bestFacesRead.map( faceRead => validateFaceRead(faceRead) )));
        DiceKeyMemoryStore.addCenterFaceOrientationWhenScanned(diceKey);
        onDiceKeyReadCallback(diceKey.rotateToTurnCenterFaceUpright());
      } catch {}
    }
    return true;
  })

  /**
   * This logic determines whether we've met the conditions for scanning,
   * which is currently either:
   *   (1) a perfect scan with no errors, or
   *   (2) only errors in underlines or overlines that can be correct by a
   *       math of one underline/overline to the OCR result, and which
   *       we've been unable to fix after four frames and at least 1 second
   *       of trying to get a better image.
   */
  private processFacesRead = action ( (facesRead?: FaceRead[]): boolean => {
    this.facesRead = facesRead;
    // Can't finish if there isn't a majority value for each face.
    if (!allFacesReadHaveMajorityValues(facesRead)) {
      this.msSinceErrorsNarrowedToJustBitErrors = undefined;
      this.framesSinceErrorsNarrowedToJustBitErrors = undefined;
      return this.scanningSuccessfulEnoughToTerminate = false;
    }
    const errorTypes = allDiceErrorTypes(facesRead);
    if (errorTypes.length === 0) {
      // All faces have majority values and no errors found -- we're done
      this.bestFacesRead = facesRead;
      return this.scanningSuccessful();
    }

    const errorsAreOnlyBitErrors = errorTypes.every( e =>
        e === "undoverline-bit-mismatch" || e === "undoverline-missing"
          // should we allow || e === "ocr-second-choice"?        
    );
    if (!errorsAreOnlyBitErrors) {
      this.msSinceErrorsNarrowedToJustBitErrors = undefined;
      this.framesSinceErrorsNarrowedToJustBitErrors = undefined;
      return this.scanningSuccessfulEnoughToTerminate = false;
    }
    
    if (this.msSinceErrorsNarrowedToJustBitErrors == null ||
      this.framesSinceErrorsNarrowedToJustBitErrors == null
    ) {
      this.msSinceErrorsNarrowedToJustBitErrors = Date.now();
      this.framesSinceErrorsNarrowedToJustBitErrors = 0;
    }

    // Require at last 1 second and 4 frames to be processed before
    // giving up on correcting the error.
    if (!this.bestFacesRead || allDiceErrorTypes(this.bestFacesRead).length >= errorTypes.length)
    this.bestFacesRead = facesRead;
    if (
      Date.now() - this.msSinceErrorsNarrowedToJustBitErrors > 1000 &&
      ++this.framesSinceErrorsNarrowedToJustBitErrors >= 4
    ) {
      return this.scanningSuccessful();
    } else {
      return false;
    }
  });

  /**
   * Handle frames processed by the web worker, displaying the received
   * overlay image above the video image.
   */
  handleProcessedCameraFrame = action ( (response: ProcessFrameResponse, overlayCanvasCtx: CanvasRenderingContext2D ): void => {
    const {width, height, facesReadObjectArray, exception} = response;
    if (exception != null) {
      return;
    }

    this.frameSize = {width, height};

    this.frameProcessedTimesMs.push(Date.now());
    if (this.frameProcessedTimesMs.length > 1) {
      const msPerFrame = (
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.frameProcessedTimesMs.at(-1)! - this.frameProcessedTimesMs[0]!
      ) / (this.frameProcessedTimesMs.length - 1);
      this.framesPerSecond = Math.round( 10000 / msPerFrame) / 10;
      if (this.frameProcessedTimesMs.length === 4) {
        this.frameProcessedTimesMs.shift();
      }
    }

    const facesRead = facesReadObjectArray?.map( faceReadObject => {
      const faceRead: FaceReadWithImageIfErrorFound = FaceRead.fromJsonObject(faceReadObject);
      faceRead.squareImageAsRgbaArray = faceReadObject.squareImageAsRgbaArray;
      return faceRead;
    }) as TupleOf25Items<FaceReadWithImageIfErrorFound>;
    this.processFacesRead(facesRead);

    // Render the frame onto the screen
   overlayCanvasCtx.clearRect(0, 0, overlayCanvasCtx.canvas.width, overlayCanvasCtx.canvas.height);
    if (this.facesRead) {
      renderFacesRead(overlayCanvasCtx, this.facesRead, {sourceImageSize: {width, height}});
    }
  });
}
