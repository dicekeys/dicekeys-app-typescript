import styles from "./scan-dicekey.module.css";
import {
  Component,
  ComponentEvent,
  Div,
  MonospaceSpan
} from "../web-component-framework"
import "regenerator-runtime/runtime";
import {
  Face,
  FaceRead, getImageOfFaceRead
} from "@dicekeys/read-dicekey-js";
import {
  DiceKey, TupleOf25Items
} from "../dicekeys/dicekey";
import * as AppState from "../state";
import {
    ProcessFrameRequest,
    ProcessFrameResponse,
    TerminateSessionRequest,
    ProcessAugmentFrameRequest
} from "../workers/dicekey-image-frame-worker"
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";
import {
  describeHost
} from "../phrasing/api";
import {
  CameraCapture, CameraCaptureOptions
} from "./camera-capture"
import { VerifyFaceRead } from "./verify-face-read";
export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

interface ScanDiceKeyOptions extends CameraCaptureOptions {
  msDelayBetweenSuccessAndClosure?: number;
  host: string;
  derivationOptions?: DerivationOptions;
  dieRenderingCanvasSize?: number;
}

/**
 * This component scans (reads) a DiceKey using the device camera(s).
 * 
 * When possible, it will use the ImageCapture interface to grab frames
 * at a resolution that's high enough to minimize the impact of errors
 * while low enough to not make processing intolerably slow.
 * Typically 768x768 or 1024x1024 (square units to fit a square DiceKey).
 * 
 * ## Implementation notes
 * This component will always render a Video element, even though that Video
 * element will not be displayed when we're grabbing frames using
 * ImageCapture and rendering them by drawing them to a canvas.
 * If we don't send the camera data to a video element and grab frames too
 * slowly, some browsers will mute the camera image.  Ensuring the camera
 * stream is always sent to a video element, even if that video element
 * is not rendered, seems to address that problem.
 */
export class ScanDiceKey extends Component<ScanDiceKeyOptions> {
  private resolveCameraCapturePromise: undefined | ((result: CameraCapture) => void);
  private readonly cameraCapturePromise: Promise<CameraCapture>;
  public resolveWorkerReadyPromise: undefined | ((result: boolean) => void);
  private readonly workerReadyPromise: Promise<boolean>;

  cameraCapture: CameraCapture  | undefined;

  // FIXME - document
  // Progress State

  /**
   * The faces read during the process of scanning the dice, which includes details of overlines
   * and underlines so that we can correct potential errors.
   */
  private facesRead?: TupleOf25Items<FaceRead>;

  get allFacesReadHaveMajorityValues(): boolean {
    return this.facesRead?.filter( faceRead =>
      faceRead.letter != null && faceRead.digit != null
    ).length === 25;
  }

  get facesReadThatUserReportedInvalid(): FaceRead[] {
    return this.facesRead?.filter( f => f.userValidationOutcome === "user-rejected") ?? []
  }

  get userHasInvalidatedAFace(): boolean {
    return this.facesReadThatUserReportedInvalid.length > 0;
  }

  /**
   * The set of faces read that contain errors that the user has yet
   * to verify were properly corrected
   */
  get facesReadThatContainErrorsAndHaveNotBeenValidated(): FaceRead[] {
    return this.facesRead?.filter( f => f.errors && f.errors.length > 0 &&
        f.userValidationOutcome == null || f.userValidationOutcome === "user-rejected" ) ?? []
  }

  /**
   * Determines if all faces have either been read without errors or if all
   * all corrected errors have been validated by the user so as to allow
   * us to conclude that the DiceKey has been read correctly..
   */
  get allFacesHaveBeenValidated(): boolean {
    return this.facesRead != null &&
      this.facesRead.length === 25 &&
      !this.userHasInvalidatedAFace &&
      this.facesReadThatContainErrorsAndHaveNotBeenValidated.length == 0;    
  }

  protected finishDelayInProgress: boolean = false;

  /**
   * Track the set of images (frames) being processed.  In the current implementation,
   * we're only processing one at a time, but a future implementation might pipeline
   * two or more in parallel if it's safe to assume that there is parallelism to exploit.
   */
  private framesBeingProcessed = new Map<number, ImageData>();

  /**
   * If a face is read with errors, keep an image of the face so that the
   * user can verify that the error correction didn't fail. 
   */
  private errorImages = new Map<string, ImageBitmap>();

  /**
   * The background worker that processes image frames so that the
   * UI thread is not delayed by their processing.
   */
  private readonly frameWorker: Worker;

  /**
   * A session id for the current camera stream
   */
  private cameraSessionId?: string;

  // Events

  /**
   * This event is triggered when the DiceKey has been been scanned
   * successfully.
   */
  public readonly diceKeyLoadedEvent = new ComponentEvent<[DiceKey], ScanDiceKey>(this);

  /**
   * We support a delay between when we've successfully scanned a DiceKey
   * and when we report that success so that the user can see the frame
   * which we scanned successfully with the rendering on top of it and
   * have a chance to "see" the success with their own eyes before leaving
   * this user experience.
   */
  public get msDelayBetweenSuccessAndClosure(): number {
    return this.options.msDelayBetweenSuccessAndClosure == null ?
      100 // Default delay of 100 seconds
      :
      this.options.msDelayBetweenSuccessAndClosure;
  }

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ScanDiceKeyOptions
  ) {
    super(options);
    this.primaryElement.classList.add(styles.ScanDiceKey);
    this.cameraCapturePromise = new Promise<CameraCapture>( (resolve) => this.resolveCameraCapturePromise = resolve );
    this.workerReadyPromise = new Promise<boolean>( (resolve => this.resolveWorkerReadyPromise = resolve ));

    this.cameraSessionId = Math.random().toString() + Math.random().toString();
    // Create worker for processing camera frames
    this.frameWorker = new Worker('../workers/dicekey-image-frame-worker.ts');
    // Listen for messages from worker
    this.frameWorker.addEventListener( "message", this.handleMessage );
  }



  reportDiceKeyReadAndValidated = () => {
    const diceKey = DiceKey( this.facesRead?.map( faceRead => faceRead.toFace()) as TupleOf25Items<Face> );
    this.diceKeyLoadedEvent.send(diceKey);
    AppState.EncryptedCrossTabState.instance?.diceKey.set(diceKey);
    // FIXME -- store additional state regarding how confidence we are that the DiceKey was read correctly.
    // wasReadAutomaticallyAndWithoutSignificantErrors <-- derive this by looking at errors corrected
    this.remove();
  }

  renderHint = () => {
    const {seedHint, cornerLetters} = this.options.derivationOptions || {};
    const {host} = this.options;

    this.append(
      Div({class: styles.scan_instruction}, `Use your camera to read your DiceKey`)
    )

    if (host && seedHint) {
      this.append(
        Div({class: styles.hint},
          "According to ",
          describeHost(host),
          ", you provided the following hint to identify your DiceKey: ",
          MonospaceSpan().setInnerText(seedHint)
        )
      );
    } else if (host && cornerLetters && cornerLetters.length === 4) {
      this.append(
        Div({class: styles.hint},
          "According to ",
          describeHost(host),
          ", you previously used a DiceKey with the letters ",
          MonospaceSpan().setInnerText(cornerLetters.substr(0, 3).split("").join(", ")),
          ", and ",
          MonospaceSpan().setInnerText(cornerLetters[3]),
          " at each corner."
        ),
      );
    }
  }

  render() {
    super.render();
    if (!this.allFacesReadHaveMajorityValues) {
      // This image needs to be scanned
      this.renderHint();
      this.append(
        new CameraCapture({fixAspectRatioToWidthOverHeight: 1}).with( cc => { this.cameraCapture = cc; this.resolveCameraCapturePromise?.(cc);} )
      );
      this.startProcessingNewCameraFrame();
    } else if (this.facesReadThatContainErrorsAndHaveNotBeenValidated.length > 0) {
      // The scan phase is complete, but there are errors to correct.
      const faceToValidate = this.facesReadThatContainErrorsAndHaveNotBeenValidated[0];
      const imageOfFaceToValidate = this.errorImages.get(faceToValidate.uniqueIdentifier);
      if (imageOfFaceToValidate == null) {
        // This exception indicates a coding error, as the code is designed this should never occur
        throw new Error("Assertion failure: no image of face to validate");
      }
      this.append(
        new VerifyFaceRead({faceRead: faceToValidate, image: imageOfFaceToValidate}).with( vfr => {
          vfr.userConfirmedOrDenied.on( (response) => {
            if (response === "denied") {
              // We need to start over
              this.cameraSessionId = Math.random().toString() + Math.random().toString(); 
              this.facesRead = undefined;
              this.errorImages.clear();
              this.framesBeingProcessed.clear();
            } else if (this.facesReadThatContainErrorsAndHaveNotBeenValidated.length === 0) {
              // All faces have been validated by the user
              this.reportDiceKeyReadAndValidated();
            }
            this.renderSoon()
          })
        })
      )
    }
  }


  remove() {
    if (!super.remove()) {
      // This element has already been removed
      return false;
    }
    this.cameraCapture?.remove();
    // If there's an existing stream, terminate it
    this.frameWorker.removeEventListener( "message", this.handleMessage );
    this.frameWorker.postMessage({action: "terminateSession", sessionId: this.cameraSessionId} as TerminateSessionRequest);

    setTimeout( () => this.frameWorker.terminate(), this.msDelayBetweenSuccessAndClosure + 1000);
    // remove successful
    return true;
  }

  private readyReceived: boolean = false;
  handleMessage = (message: MessageEvent) => {
    if (!this.readyReceived && "action" in message.data && message.data.action === "workerReady" ) {
      this.readyReceived = true;
      this.resolveWorkerReadyPromise?.(true);
    } else if ("action" in message.data && (
        message.data.action == "processRGBAImageFrameAndRenderOverlay" || message.data.action === "processAndAugmentRGBAImageFrame")
      ) {
      this.handleProcessedCameraFrame(message.data as ProcessFrameResponse )
    }
  }


  /**
   * To process video images, we will loop through retrieving camera frames with
   * this method, calling a webworker to process the frames, and then
   * the web worker's response will trigger handleProcessedCameraFrame (below),
   * which will call back to here.
   */
  private nextRequestId = 1;
  startProcessingNewCameraFrame = async () => {
    // make sure never to send the frame until the worker is ready
    try {
      await Promise.all([this.workerReadyPromise, this.cameraCapturePromise]);
    } catch (e) {
      console.log("Exception at start of processing", e);
    }
    const imageData = await this.cameraCapture!.getFrame();
    const requestId = this.nextRequestId++;
    this.framesBeingProcessed.set(requestId, imageData);
    const {width, height, data} = imageData;
    // Create a copy of the image buffer that can be sent over to the worker
    const rgbImageAsArrayBuffer = data.buffer.slice(0);
    // Ask the background worker to process the bitmap.
    // First construct a request
    const request: ProcessFrameRequest | ProcessAugmentFrameRequest = {
      requestId,
      width, height, rgbImageAsArrayBuffer,
      action: this.cameraCapture?.isRenderedOverVideo ? "processRGBAImageFrameAndRenderOverlay" : "processAndAugmentRGBAImageFrame",
      sessionId: this.cameraSessionId!,
    };
    // The mark the objects that can be transferred to the worker.
    // This eliminates the need to copy the big memory buffer over, but the worker will now own the memory.
    const transferrableObjectsWithinRequest: Transferable[] =  [request.rgbImageAsArrayBuffer];
    // Send the request to the worker
    this.frameWorker.postMessage(request, transferrableObjectsWithinRequest);
  }

  /**
   * Handle frames processed by the web worker, displaying the received
   * overlay image above the video image.
   */
  handleProcessedCameraFrame = async (response: ProcessFrameResponse ) => {
    console.log("handleProcessedCameraFrame", (Date.now() % 100000) / 1000);
    const {requestId, width, height, rgbImageAsArrayBuffer, diceKeyReadJson} = response;

    // Remove the pre-processed image from the set of images being processed
    const originalImageData = this.framesBeingProcessed.get(requestId);
    if (originalImageData == null) {
      return;
    }
    this.framesBeingProcessed.delete(requestId);
    
    // Render the frame onto the screen
    this.cameraCapture?.drawImageDataOntoVideoCanvas(new ImageData(new Uint8ClampedArray(rgbImageAsArrayBuffer), width, height));

    this.facesRead = FaceRead.fromJson(diceKeyReadJson) as TupleOf25Items<FaceRead> | undefined;
    if (this.facesRead && originalImageData) {
      const facesReadWithErrors = this.facesRead.filter( f => f.errors && f.errors.length > 0);
      if (facesReadWithErrors.length == 0) {
        //
        // The faces were ready perfectly and there are no errors to correct.
        this.errorImages.clear();
        AppState.EncryptedCrossTabState.instance!.diceKey.value =
          DiceKey( this.facesRead.map( faceRead => faceRead.toFace()) as TupleOf25Items<Face> );

      } else {
        //
        // There are errors that will need to be corrected.
        const identifiersOfFacesWithErrors = new Set<string>(...
          facesReadWithErrors.map( f => f.uniqueIdentifier )
        );
        // Remove images of erroneously-scanned dice that are no longer needed because
        // the errors have been resolved or replaced
        [...this.errorImages.keys()]
          // filter to identifier dead ids
          .filter( id => !identifiersOfFacesWithErrors.has(id) )
          // then remove them
          .forEach( (deadId) => this.errorImages.delete(deadId) );

        // Capture images of faces in current scan that have errors
        const sourceImageBitmap = await createImageBitmap(originalImageData);
        const facesReadWithErrorsButNoErrorImages = facesReadWithErrors.
          filter( faceRead => !this.errorImages.has(faceRead.uniqueIdentifier));
        await Promise.all(facesReadWithErrorsButNoErrorImages.map( async (face) => {
          // Get the image of the die with an error and store it where we can get to it
          // if we need the user to verify that we read it correctly.
          const faceReadImageData = getImageOfFaceRead(sourceImageBitmap, face, this.options.dieRenderingCanvasSize);
          const faceImageBitmap = await createImageBitmap(faceReadImageData);
          this.errorImages.set(face.uniqueIdentifier, faceImageBitmap);
        }));
      }
    }

    if (this.allFacesReadHaveMajorityValues && !this.finishDelayInProgress) {
      // const diceKey = DiceKey( facesRead.map( faceRead => faceRead.toFace() ));
      // FIXME -- add known errors here.
      this.finishDelayInProgress = true;
      setTimeout( () => {
        // FIXME
        this.finishDelayInProgress = false;
        if (this.allFacesHaveBeenValidated) {
          this.reportDiceKeyReadAndValidated();
          this.parent?.renderSoon()
        } else {
          this.renderSoon();
        }
      }, this.msDelayBetweenSuccessAndClosure);
    } else {
      // Trigger fetch of new camera frame
      setTimeout(this.startProcessingNewCameraFrame, 0)
    }
  }
};
