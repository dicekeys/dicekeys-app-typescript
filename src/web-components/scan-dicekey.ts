import {
  getElementDimensions,
  Component, Attributes,
  ComponentEvent,
  Canvas,
  Div,
  MonospaceSpan,
  Select,
  Option,
  Video,
} from "../web-component-framework"
import {
} from "../web-component-framework"
import "regenerator-runtime/runtime";
import {
  FaceRead, FaceReadJson
} from "../dicekeys/face-read";
import {
  DiceKey
} from "../dicekeys/dicekey";
import { 
  DiceKeyAppState
} from "../state/app-state-dicekey";

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
  Camera,
  CamerasOnThisDevice,
  videoConstraintsForDevice
} from "./cameras-on-this-device";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

interface Frame {
  width: number;
  height: number;
  rgbImageAsArrayBuffer: ArrayBufferLike;
}

interface ScanDiceKeyOptions extends Attributes {
  msDelayBetweenSuccessAndClosure?: number;
  host: string;
  derivationOptions?: DerivationOptions;
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
  /**
   * This separate module tracks the cameras attached to the device
   */
  private readonly camerasOnThisDevice: CamerasOnThisDevice;

  /**
   * The id of the camera from which the current video feed originates.
   */
  camerasDeviceId: string | undefined;

  /**
   * Set to true when we are able to use the ImageCapture API to grab
   * frames from the camera and images are rendered into a canvas
   */
  private useImageCapture: boolean = imageCaptureSupported;
  /**
   * Set to true when raw input frames are sent directly to a video element
   * and then captured by scraping them out of the video element
   */
  private get useVideoToDisplay(): boolean {return !this.useImageCapture };

  /**
   * When ImageCapture is not available and we render raw video feeds, we
   * overlay a translucent image displaying what we were and were not able
   * to read from the last analyzed frame using this canvas element, which
   * is at a higher z-index than the video below it.
   */
  private overlayCanvasComponent?: Canvas;
  private get overlayCanvas() {return this.overlayCanvasComponent?.primaryElement};
  private get overlayCanvasCtx() {return this.overlayCanvas?.getContext("2d")};

  /**
   * For rendering raw camera input to the screen
   */
  private videoComponent?: Video;

  /**
   * For rendering camera input to the screen after it has been
   * processed and augmented to display what we've been able to read.
   */
  private videoCanvas?: HTMLCanvasElement;

  private cameraSelectionMenu?: HTMLSelectElement;
  private get videoPlayer() {return this.videoComponent?.primaryElement}
  
  private readonly frameWorker: Worker;

  /**
   * A re-usable canvas into which to capture image frames
   */
  private captureCanvas?: HTMLCanvasElement;
  private captureCanvasCtx?: CanvasRenderingContext2D;

  /**
   * The media stream from the current camera
   */
  private mediaStream?: MediaStream;

  /**
   * A session id for the current camera stream
   */
  private cameraSessionId?: string;

  /**
   * The ImageCapture object used to grab frames from the camera
   * (not supported by all browsers.  We fallback to rendering
   * to a video element and then capturing frames out of the
   * video rendered to the screen.)
   */
  private imageCapture?: ImageCapture;

  
  // Events
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
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ScanDiceKeyOptions
  ) {
    super(options);
    this.cameraSessionId = Math.random().toString() + Math.random().toString();
    // Create worker for processing camera frames
    this.frameWorker = new Worker('../workers/dicekey-image-frame-worker.ts');
    // Listen for messages from worker
    this.frameWorker.addEventListener( "message", this.handleMessage );
    //
    // Initialize the list of device cameras
    this.camerasOnThisDevice = new CamerasOnThisDevice({});
    this.camerasOnThisDevice.updated.on( (cameras) => {
      // Whenever there's an update to the camera list, if we don't have an
      // active camera, set the active camera to the first camera in the list.
      if (!this.mediaStream && cameras.length > 0) {
        this.setCamera(cameras[0].deviceId);
      }
      // And update the rendered camera list
      this.renderCameraList(cameras);
    })
  }

  render() {
    super.render();
    const {seedHint, cornerLetters} = this.options.derivationOptions || {};
    const {host} = this.options;

    this.append(
      Div({class: "scan-instruction"}, `Use your camera to read your DiceKey`)
    )

    if (host && seedHint) {
      this.append(
        Div({class: "hint"},
          "According to ",
          describeHost(host),
          ", you provided the following hint to identify your DiceKey: ",
          MonospaceSpan().setInnerText(seedHint)
        )
      );
    } else if (host && cornerLetters && cornerLetters.length === 4) {
      this.append(
        Div({class: "hint"},
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

    this.append(
      Div({class: "content"},
        ...(this.useVideoToDisplay ? [Canvas({class: "overlay"}).with( c => this.overlayCanvasComponent = c )] : []),
        Video({style: "display: none; visibility: hidden;"}).with( c => this.videoComponent = c ),
        this.useImageCapture ?
          Canvas().withElement( c => { this.videoCanvas = c; }) :
          undefined,
        ),
        Div({class: "centered-controls"},
          Select({style: "visibility: hidden;"}).withElement( e => this.cameraSelectionMenu = e )
        ),
    );
    this.captureCanvas = document.createElement("canvas") as HTMLCanvasElement;
    this.captureCanvasCtx = this.captureCanvas.getContext("2d")!;
  }

  
  /**
   * Update the selection menu of cameras
   */
  renderCameraList = (cameras: Camera[] = this.camerasOnThisDevice.cameras) => {
    if (!this.cameraSelectionMenu) {
      return;
    }

    if (cameras.length < 2) {
      // There's only one camera option, so hide the camera-selection field.
      this.cameraSelectionMenu.style.setProperty("display", "none");
      return;
    }

    this.cameraSelectionMenu.style.setProperty("display", "block");

    // Remove all child elements (select options)
    this.cameraSelectionMenu.innerHTML = '';
    // Replace old child elements with updated select options
    this.cameraSelectionMenu.append(
      ...cameras.map( (camera) => Option({text: camera.name, value: camera.deviceId}).primaryElement )
    );
    this.cameraSelectionMenu.value = this.camerasDeviceId || "";
    this.cameraSelectionMenu.style.setProperty("visibility", "visible");
    // Handle user selection of cameras
    this.cameraSelectionMenu.addEventListener("change", (_event) => {
      // The deviceID of the camera was stored in the value name of the option,
      // so it can be retrieved from the value field fo the select element
      const deviceId = this.cameraSelectionMenu?.value;
      if (deviceId) {
        this.setCamera(deviceId);
      }
    });
  }

  remove() {
    if (!super.remove()) {
      // This element has already been removed
      return false;
    }
    // If there's an existing stream, terminate it
    this.mediaStream?.getTracks().forEach( track => track.readyState === "live" && track.enabled && track.stop() );
    this.frameWorker.removeEventListener( "message", this.handleMessage );
    this.frameWorker.postMessage({action: "terminateSession", sessionId: this.cameraSessionId} as TerminateSessionRequest);

    setTimeout( () => this.frameWorker.terminate(), this.msDelayBetweenSuccessAndClosure + 1000);
    // remvoe successful
    return true;
  }

  private readyReceived: boolean = false;
  handleMessage = (message: MessageEvent) => {
    if (!this.readyReceived && "action" in message.data && message.data.action === "workerReady" ) {
      this.readyReceived = true;
      this.onWorkerReady();
    } else if ("action" in message.data && (
        message.data.action == "processRGBAImageFrameAndRenderOverlay" || message.data.action === "processAndAugmentRGBAImageFrame")
      ) {
      this.handleProcessedCameraFrame(message.data as ProcessFrameResponse )
    }
  }

  onWorkerReady = () => {
    this.startProcessingNewCameraFrame();
  }

  setCamera = (deviceId: string) =>
    this.setCameraByConstraints(videoConstraintsForDevice(deviceId));

  /**
   * Set the current camera
   */
  setCameraByConstraints = async (
    mediaTrackConstraints: MediaTrackConstraints
  ) => {
    if (this.imageCapture) {
      this.imageCapture = undefined;
    }
    const oldMediaStream = this.mediaStream;
    this.mediaStream = undefined;
    // If there's an existing stream, terminate it
    oldMediaStream?.getTracks().forEach(track => {
      if (track.readyState === "live" && track.enabled) {
        try {
          track.stop()
        } catch (e) {
          console.log("Exception stopping track", e);
        }
      }
    });
    // Now set the new stream
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({video: mediaTrackConstraints});
    } catch (e) {
      console.log("Media stream creation failed", e);
    }
    const track = this.mediaStream?.getVideoTracks()[0];
    if (!track || track.readyState !== "live" || !track.enabled || track.muted ) {
      console.log("Could not update camera", track);
      return;
    }
    const {
      deviceId, height, width
    } = track.getSettings();
    this.camerasDeviceId = deviceId;
    if (this.videoPlayer) {
      this.videoPlayer.srcObject = this.mediaStream!;
    }
    if (track && this.useImageCapture) {
      this.imageCapture = new ImageCapture(track);
    } else if (this.videoPlayer) {
      this.videoPlayer.style.setProperty("display", "block");
      this.videoPlayer.style.setProperty("visibility", "visible");
      if (height && width) {
        // this.videoPlayer!.width = Math.min( width, 1024 );
        // this.videoPlayer!.height = Math.min( height, 1024 );
      }
    }
    this.renderCameraList();
    return;
  }

  getFrameUsingImageCapture = async (): Promise<Frame | undefined> => {
    const track = this.imageCapture?.track;
    console.log("getFrameUsingImageCapture", (Date.now() % 100000) / 1000);
    if (track == null || track.readyState !== "live" || !track.enabled || track.muted) {
      if (track?.muted) {
        console.log("Track muted");
        // For some reason, if we don't read enough frames fast enough, browser may mute the
        // track.  If they do, just re-open the camera.
        if (this.camerasDeviceId) {
          console.log("Resetting camera");
          this.setCamera(this.camerasDeviceId!);
        }
        track?.addEventListener("unmute", () => { console.log("Track unmuted"); } );
      }
      return;
    }
    const bitMap = await this.imageCapture!.grabFrame();
    console.log("Frame grabbed", (Date.now() % 100000) / 1000);
    const {width, height} = bitMap;
    console.log(`Grabbing frame with dimensions ${width}x${height}`)
    if (this.captureCanvas!.width != width || this.captureCanvas!.height != height) {
      [this.captureCanvas!.width, this.captureCanvas!.height] = [width, height];
      this.captureCanvasCtx = this.captureCanvas!.getContext("2d")!;
    }
    this.captureCanvasCtx!.drawImage(bitMap, 0, 0);
    const rgbImageAsArrayBuffer = this.captureCanvasCtx!.getImageData(0, 0, width, height).data.buffer;
    return {width, height, rgbImageAsArrayBuffer};
  };

  getFrameFromVideoPlayer = (): Frame | undefined => {
    if (!this.videoPlayer) {
      return;
    }
    if (this.videoPlayer!.videoWidth == 0 || this.videoPlayer!.videoHeight == 0) {
      // There's no need to take action if there's no video
      return;
    }

    // Ensure the capture canvas is the size of the video being retrieved
    if (this.captureCanvas!.width != this.videoPlayer!.videoWidth || this.captureCanvas!.height != this.videoPlayer!.videoHeight) {
        [this.captureCanvas!.width, this.captureCanvas!.height] = [this.videoPlayer!.videoWidth, this.videoPlayer!.videoHeight];
        this.captureCanvasCtx = this.captureCanvas!.getContext("2d")!;
    }
    this.captureCanvasCtx!.drawImage(this.videoPlayer!, 0, 0);
    const {width, height, data} = this.captureCanvasCtx!.getImageData(0, 0, this.captureCanvas!.width, this.captureCanvas!.height);
    const rgbImageAsArrayBuffer = data.buffer;
    return {width, height, rgbImageAsArrayBuffer};
  }

  /**
   * To process video images, we will loop through retrieving camera frames with
   * this meethod, calling a webworker to process the frames, and then
   * the web worker's response will trigger handleProcessedCameraFrame (below),
   * which will call back to here.
   */
  startProcessingNewCameraFrame = async () => {
    if (this.removed) {
      // The element is no longer displaying and so processing should stop.
      return;
    }
    const frame = this.useImageCapture ?
      await this.getFrameUsingImageCapture() : this.getFrameFromVideoPlayer();
    if (frame == null) {
      // There's no need to take action if there's no video
      console.log("No frame received.  Entering wait cycle");
      setTimeout(this.startProcessingNewCameraFrame, 100);
      return;
    }

//     if (this.videoCanvas) {
//       // Copy frame into video canvas.
//       const {rgbImageAsArrayBuffer, width, height} = frame;
//       const ctx = this.videoCanvas.getContext("2d")!;
//       const frameImageData = ctx.createImageData(width, height);
// //        const overlayImageData = ctx.getImageData(0, 0, width, height);
//       frameImageData.data.set(new Uint8Array(rgbImageAsArrayBuffer));
//       ctx.putImageData(frameImageData, 0, 0);
//     }

    // Ask the background worker to process the bitmap.
    // First construct a requeest
    const request: ProcessFrameRequest | ProcessAugmentFrameRequest = {
      ...frame,
      action: this.useVideoToDisplay ? "processRGBAImageFrameAndRenderOverlay" : "processAndAugmentRGBAImageFrame",
      sessionId: this.cameraSessionId!,
    };
    // The mark the objects that can be transffered to the worker.
    // This eliminates the need to copy the big memory buffer over, but the worker will now own the memory.
    const transferrableObjectsWithinRequest: Transferable[] =  [request.rgbImageAsArrayBuffer];
    // Send the request to the worker
    this.frameWorker.postMessage(request, transferrableObjectsWithinRequest);
  }

  protected finishDelayInProgress: boolean = false;
  /**
   * Handle frames processed by the web worker, displaying the received
   * overlay image above the video image.
   */
  handleProcessedCameraFrame = async (response: ProcessFrameResponse ) => {
    console.log("handleProcessedCameraFrame", (Date.now() % 100000) / 1000);
    const {width, height, rgbImageAsArrayBuffer, diceKeyReadJson, isFinished} = response;
    const {overlayCanvas} = this;
    if (overlayCanvas) {
      // Ensure the overlay canvas is the same size as the captured canvas
      const overlayImageData = this.overlayCanvasCtx!.createImageData(width, height);
      overlayImageData.data.set(new Uint8Array(rgbImageAsArrayBuffer));
      this.overlayCanvasCtx?.putImageData(overlayImageData, 0, 0);
    }
    if (this.videoCanvas) {
      // Grow the canvas to match the size of its parent element.
      var rect = getElementDimensions(this.videoCanvas.parentElement!);
      if (rect && (this.videoCanvas.width !== rect.width || this.videoCanvas.height !== rect.height)) {
        this.videoCanvas.setAttribute("width", rect.width.toString());
        this.videoCanvas.setAttribute("height", rect.height.toString());
        this.videoCanvas.width = rect.width;
        this.videoCanvas.height = rect.height;
      }
      // 
      const ctx = this.videoCanvas.getContext("2d")!;
      const imageData = new ImageData(new Uint8ClampedArray(rgbImageAsArrayBuffer), width, height);
      const imageBitmap = await createImageBitmap(imageData);
      const canvasWidthOverHeight = ctx.canvas.width / ctx.canvas.height;
      const srcWidthOverHeight = width / height;
      const [srcWidth, srcHeight] = canvasWidthOverHeight > srcWidthOverHeight ?
        // The canvas is too wide for the source (the captured frame), so reduce the source's height
        // to make the source relatively wider
        [width, width / canvasWidthOverHeight] :
        // The canvas is too tall for the source (the captured frame), so reduce the source's width
        // to make it relatively taller
        [height * canvasWidthOverHeight, height];
      const srcX = (width - srcWidth) / 2;
      const srcY = (height - srcHeight) / 2;
      ctx.drawImage(imageBitmap, srcX, srcY, srcWidth, srcHeight, 0, 0, this.videoCanvas.width, this.videoCanvas.height);
    }

    if (isFinished && !this.finishDelayInProgress) {
      const diceKey = DiceKey(
        (JSON.parse(diceKeyReadJson) as FaceReadJson[])
        .map( FaceRead.fromJson )
        .map( faceRead => faceRead.toFace() )
      );
      DiceKeyAppState.instance!.diceKey.value = diceKey;
      this.finishDelayInProgress = true;
      setTimeout( () => {
        this.diceKeyLoadedEvent.send(diceKey);
        this.remove();
        this.finishDelayInProgress = false;
        this.parent?.renderSoon()
      }, this.msDelayBetweenSuccessAndClosure);
    } else {
      // Trigger fetch of new camera frame
      setTimeout(this.startProcessingNewCameraFrame, 0)
    }
  }
};
