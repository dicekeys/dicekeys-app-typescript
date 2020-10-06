import styles from "./scan-dicekey.module.css";
import {
  Component,
  ComponentEvent,
  Div,
  MonospaceSpan,
  Observable,
  Span
} from "../../web-component-framework"
import {
  Face,
  FaceRead, FaceReadError,
  renderFacesRead
} from "@dicekeys/read-dicekey-js";
import {
  DiceKey, TupleOf25Items
} from "../../dicekeys/dicekey";
import * as AppState from "../../state";
import {
    ProcessFrameRequest,
    ProcessFrameResponse,
    TerminateSessionRequest,
    FaceReadWithImageIfErrorFound
} from "../../workers/dicekey-image-frame-worker"
import { DerivationOptions } from "@dicekeys/dicekeys-api-js";
import {
  describeHost
} from "../../phrasing/api";
import {
  CameraCapture, CameraCaptureOptions
} from "./camera-capture"
import { VerifyFaceRead } from "./verify-face-read";
import { browserInfo } from "~utilities/browser";
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
  private facesRead?: TupleOf25Items<FaceReadWithImageIfErrorFound>;

  get  allFacesReadHaveMajorityValues(): boolean {
    return this.facesRead?.filter( faceRead =>
      faceRead.letter != null && faceRead.digit != null
    )?.length === 25;
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
  get facesReadThatContainErrorsAndHaveNotBeenValidated(): FaceReadWithImageIfErrorFound[] {
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

  /**
   * A list of all the error types impacting the set of die faces
   * (effectively a set presented as a list)
   */
  private get allDiceErrorTypes(): FaceReadError["type"][] {
    const faceReadErrorTypes = new Set<FaceReadError["type"]>();
    for (const face of this.facesRead ?? []) {
      for (const errorType of face.errors) {
         faceReadErrorTypes.add(errorType.type);
      }
    }
    return [...faceReadErrorTypes];
  }

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

  /**
   * This logic determines whether we've met the conditions for scanning,
   * which is currently either:
   *   (1) a perfect scan with no errors, or
   *   (2) only errors in underlines or overlines that can be correct by a
   *       math of one underline/overline to the OCR result, and which
   *       we've been unable to fix after four frames and at least 1 second
   *       of trying to get a better image.
   */
  private get shouldFinishScanning(): boolean {
    // Can't finish if there isn't a majority value for each face.
    if (!this.allFacesReadHaveMajorityValues) {
      this.msSinceErrorsNarrowedToJustBitErrors = undefined;
      this.framesSinceErrorsNarrowedToJustBitErrors = undefined;
      return false;
    }
    const errorTypes = this.allDiceErrorTypes;
    if (errorTypes.length === 0) {
      // All faces have majority values and no errors found -- we're done
      return true;
    }

    const errorsAreOnlyBitErrors = errorTypes.every( e =>
        e === "undoverline-bit-mismatch" || e === "undoverline-missing"
          // should we allow || e === "ocr-second-choice"?        
    );
    if (!errorsAreOnlyBitErrors) {
      this.msSinceErrorsNarrowedToJustBitErrors = undefined;
      this.framesSinceErrorsNarrowedToJustBitErrors = undefined;
      return false;
    }
    
    if (this.msSinceErrorsNarrowedToJustBitErrors == null ||
      this.framesSinceErrorsNarrowedToJustBitErrors == null
    ) {
      this.msSinceErrorsNarrowedToJustBitErrors = Date.now();
      this.framesSinceErrorsNarrowedToJustBitErrors = 0;
    }

    // Require at last 1 second and 4 frames to be processed before
    // giving up on correcting the error.
    return (
      Date.now() - this.msSinceErrorsNarrowedToJustBitErrors > 1000 &&
      ++this.framesSinceErrorsNarrowedToJustBitErrors >= 4
    );
  }

  protected finishDelayInProgress: boolean = false;

  /**
   * Track the set of images (frames) being processed.  In the current implementation,
   * we're only processing one at a time, but a future implementation might pipeline
   * two or more in parallel if it's safe to assume that there is parallelism to exploit.
   */
  // FIXME - remove private framesBeingProcessed = new Map<number, ImageData>();

  /**
   * If a face is read with errors, keep an image of the face so that the
   * user can verify that the error correction didn't fail. 
   */
  // FIXME REMOVE private errorImages = new Map<string, {width: number, height: number, data: Uint8ClampedArray}>();

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
  public readonly diceKeyLoadedEvent = new ComponentEvent<[DiceKey], this>(this);

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
    this.addClass(styles.ScanDiceKey);
    this.cameraCapturePromise = new Promise<CameraCapture>( (resolve) => this.resolveCameraCapturePromise = resolve );
    this.workerReadyPromise = new Promise<boolean>( (resolve => this.resolveWorkerReadyPromise = resolve ));

    this.cameraSessionId = Math.random().toString() + Math.random().toString();
    // Create worker for processing camera frames
    this.frameWorker = new Worker('../../workers/dicekey-image-frame-worker.ts');
    // Listen for messages from worker
    this.frameWorker.addEventListener( "message", this.handleMessage );
  }



  reportDiceKeyReadAndValidated = () => {
    const diceKey = DiceKey( this.facesRead?.map( faceRead => faceRead.toFace()) as TupleOf25Items<Face> );
    this.diceKeyLoadedEvent.send(diceKey);
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
        Div({style: "color: yellow;"},
          // browser info
          Span({text: `${browserInfo.browser} ${browserInfo.browserVersion} ${browserInfo.os} ${browserInfo.osVersion
          } mobile=${browserInfo.mobile} screen=${browserInfo.screenSize.width}x${browserInfo.screenSize.height} `}),
          Span({}).withElement( e => this.frameSize.observe( fs => e.innerText = fs ? ` frame size: ${fs.width}x${fs.height} ` : `` )),
          // frames per second
          Span({}).withElement( e => this.framesPerSecond.observe( fps => e.textContent = `${(fps ?? 0).toString()}fps ` ))
        ),
        new CameraCapture({fixAspectRatioToWidthOverHeight: 1, onExceptionEvent: this.options.onExceptionEvent}).with( cc => {
          this.cameraCapture = cc;
          this.resolveCameraCapturePromise?.(cc);
        } )
      );
      this.startProcessingNewCameraFrame();
    } else if (this.facesReadThatContainErrorsAndHaveNotBeenValidated.length > 0) {
      // The scan phase is complete, but there are errors to correct.
      const faceToValidate = this.facesReadThatContainErrorsAndHaveNotBeenValidated[0];
      const imageDataRgba = faceToValidate.squareImageAsRgbaArray!;
//      const imageOfFaceToValidate = this.errorImages.get(faceToValidate.uniqueIdentifier);
      if (imageDataRgba.length == 0) {
        // This exception indicates a coding error, as the code is designed this should never occur
        throw new Error("Assertion failure: no image of face to validate");
      }
      const imageSize = Math.sqrt(imageDataRgba.length / 4);
      this.append(
        new VerifyFaceRead({faceRead: faceToValidate, image: {data: imageDataRgba, width: imageSize, height: imageSize}}).with( vfr => {
          vfr.userConfirmedOrDenied.on( (response) => {
            if (response === "denied") {
              // We need to start over
              this.cameraSessionId = Math.random().toString() + Math.random().toString(); 
              this.facesRead = undefined;
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
    } else if ("action" in message.data &&
      message.data.action === "processRGBAImageFrame"
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
    const {width, height, data} = imageData;
    // Create a copy of the image buffer that can be sent over to the worker
    const rgbImageAsArrayBuffer = data.buffer.slice(0);
    // Ask the background worker to process the bitmap.
    // First construct a request
    const request: ProcessFrameRequest = {
      requestId,
      width, height, rgbImageAsArrayBuffer,
      action: "processRGBAImageFrame",
      sessionId: this.cameraSessionId!,
    };
    // The mark the objects that can be transferred to the worker.
    // This eliminates the need to copy the big memory buffer over, but the worker will now own the memory.
    const transferrableObjectsWithinRequest: Transferable[] =  [request.rgbImageAsArrayBuffer];
    // Send the request to the worker
    this.frameWorker.postMessage(request, transferrableObjectsWithinRequest);
  }

  /**
   * Tracks the number of frames processed per second
   */
  public framesPerSecond = new Observable<number>(0);
  public frameSize = new Observable<{width: number, height: number}>({width: 0, height: 0});

  /**
   * Record the times each processed frame comes back (in ms) so
   * that we can calculate the frame rate (framesPerSecond)
   */
  private frameProcessedTimesMs: number[] = [];

  /**
   * Handle frames processed by the web worker, displaying the received
   * overlay image above the video image.
   */
  handleProcessedCameraFrame = async (response: ProcessFrameResponse ) => {
    // console.log("handleProcessedCameraFrame", (Date.now() % 100000) / 1000);
    const {width, height, facesReadObjectArray, exception} = response;

    this.frameSize.value = {width, height};

    if (exception != null) {
      return this.throwException(exception, "From frame worker");
    }

    this.frameProcessedTimesMs.push(Date.now());
    if (this.frameProcessedTimesMs.length > 1) {
      const msPerFrame = (
        this.frameProcessedTimesMs[this.frameProcessedTimesMs.length-1] -
        this.frameProcessedTimesMs[0]
      ) / (this.frameProcessedTimesMs.length - 1);
      this.framesPerSecond.value = Math.round( 10000 / msPerFrame) / 10;
      if (this.frameProcessedTimesMs.length === 4) {
        this.frameProcessedTimesMs.shift();
      }
    }
 
    try {
      // Render the frame onto the screen
      const overlayCanvasCtx = this.cameraCapture?.getOverlayCanvasCtx(width, height);
      if (overlayCanvasCtx) {
        overlayCanvasCtx.clearRect(0, 0, width, height);
        if (this.facesRead) {
          renderFacesRead(overlayCanvasCtx, this.facesRead, {});
        }
      }

      this.facesRead = facesReadObjectArray?.map( faceReadObject => {
        const faceRead: FaceReadWithImageIfErrorFound = FaceRead.fromJsonObject(faceReadObject);
        faceRead.squareImageAsRgbaArray = faceReadObject.squareImageAsRgbaArray;
        return faceRead;
      }) as TupleOf25Items<FaceReadWithImageIfErrorFound>;
      if (this.facesRead && this.facesRead.length === 25 && this.facesReadThatContainErrorsAndHaveNotBeenValidated.length === 0 ) {
        // The faces were ready perfectly and there are no errors to correct.
        AppState.EncryptedCrossTabState.instance!.diceKey.value =
          DiceKey( this.facesRead.map( faceRead => faceRead.toFace()) as TupleOf25Items<Face> );
      }

      if (this.shouldFinishScanning) {
        this.finishDelayInProgress = true;
        setTimeout( () => {
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
    } catch (e) {
      this.throwException(e, "Handling a processed frame");
    }
  }

};
