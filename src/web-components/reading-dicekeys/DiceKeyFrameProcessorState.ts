import {
  FaceRead, renderFacesRead
} from "@dicekeys/read-dicekey-js";
import {
  allDiceErrorTypes, allFacesReadHaveMajorityValues
} from "../../dicekeys/faces-read";
import {
    ProcessFrameResponse,
} from "../../workers/dicekey-image-frame-worker";
import {
  FaceReadWithImageIfErrorFound
} from "../../dicekeys/faces-read"
import { action, makeAutoObservable } from "mobx";
import { TupleOf25Items } from "../../dicekeys";

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


  constructor(private onDiceKeyRead?: (facesRead: TupleOf25Items<FaceRead>) => any) {
    makeAutoObservable(this);
  }

  private scanningSuccessful = action ( (): true => {
    this.scanningSuccessfulEnoughToTerminate = true;
    if (this.bestFacesRead && this.onDiceKeyRead) {
      this.onDiceKeyRead(this.bestFacesRead as TupleOf25Items<FaceRead>)
      this.onDiceKeyRead = undefined;
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
        this.frameProcessedTimesMs[this.frameProcessedTimesMs.length-1] -
        this.frameProcessedTimesMs[0]
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
   overlayCanvasCtx.clearRect(0, 0, width, height);
    if (this.facesRead) {
      renderFacesRead(overlayCanvasCtx, this.facesRead, {});
    }
  });
};
