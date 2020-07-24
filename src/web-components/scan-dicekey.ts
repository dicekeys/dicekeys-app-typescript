import {
  getElementDimensions,
  Component, Attributes,
  ComponentEvent,
  Canvas,
  Div,
  MonospaceSpan,
  Select,
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

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

interface Frame {
  width: number;
  height: number;
  rgbImageAsArrayBuffer: ArrayBufferLike;
}

const  videoConstraintsForDevice = (deviceId: string): MediaStreamConstraints => ({
  video: {
    deviceId,
    width: { ideal: 1900 },
    height: { ideal: 1024 },
    aspectRatio: {ideal: 1},
//    advanced: [{focusDistance: {ideal: 0}}]
  },
});

interface ScanDiceKeyOptions extends Attributes {
  msDelayBetweenSuccessAndClosure?: number;
  host: string;
  derivationOptions?: DerivationOptions;
}


/**
 * This class implements the demo page.
 */
export class ScanDiceKey extends Component<ScanDiceKeyOptions> {
  private useImageCapture: boolean = imageCaptureSupported;
  private useVideoToDisplay: boolean = !this.useImageCapture;

  private overlayCanvasComponent?: Canvas;
  private get overlayCanvas() {return this.overlayCanvasComponent?.primaryElement};
  private get overlayCanvasCtx() {return this.overlayCanvas?.getContext("2d")};
  private videoComponent?: Video;
  private videoCanvas?: HTMLCanvasElement;
  private cameraSelectionMenu?: HTMLSelectElement;
  private get videoPlayer() {return this.videoComponent?.primaryElement}
  
  private readonly frameWorker: Worker;

  private captureCanvas?: HTMLCanvasElement;
  private captureCanvasCtx?: CanvasRenderingContext2D;
  private mediaStream?: MediaStream;
  private cameraSessionId?: string;
  private imageCapture?: ImageCapture;

  
  // Events
  public readonly diceKeyLoadedEvent = new ComponentEvent<[DiceKey], ScanDiceKey>(this);

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
    this.frameWorker = new Worker('../workers/dicekey-image-frame-worker.ts');
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
        this.useVideoToDisplay ?
          Div({class: "content"}).append(
            Video({style: "visibility: hidden;"}).with( c => this.videoComponent = c )
           ) :
          Canvas().withElement( c => { this.videoCanvas = c; }) //  c.setAttribute("width", "512"); c.setAttribute("height", "512")      
      ),
      Div({class: "centered-controls"},
        Select({style: "visibility: hidden;"}).withElement( e => this.cameraSelectionMenu = e )
      ),
    );
    this.captureCanvas = document.createElement("canvas") as HTMLCanvasElement;
    this.captureCanvasCtx = this.captureCanvas.getContext("2d")!;

    // Bind to HTML
    this.mediaStream = undefined;
    this.cameraSessionId = Math.random().toString() + Math.random().toString();

    // Start out with the default camera
    this.updateCamera();
    this.frameWorker.addEventListener( "message", this.handleMessage );
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

  defaultVideoConstraints: MediaStreamConstraints = {video: {
    width: { ideal: 1900, min: 768 },
    height: { ideal: 1024, min: 768 },
    facingMode: "environment" // "user" (faces the user) | "environment" (away from user)
  }}
  camerasDeviceId: string | undefined;
  /**
   * Set the current camera
   */
  updateCamera = async (
    mediaStreamConstraints: MediaStreamConstraints = this.defaultVideoConstraints
  ): Promise<MediaStream | undefined> => {
    const oldMediaStream = this.mediaStream;
    // If there's an existing stream, terminate it
    oldMediaStream?.getTracks().forEach(track => track.readyState === "live" && track.enabled && track.stop() );
    // Now set the new stream

    const newStream = this.mediaStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
    const track = newStream.getVideoTracks()[0];
    this.imageCapture = new ImageCapture(track);
    if (!track || track.readyState !== "live" || !track.enabled || track.muted ) {
      return;
    }
    
    const {
      deviceId, height, width,
      // facingMode, aspectRatio, frameRate
    } = track.getSettings();
    this.camerasDeviceId = deviceId;
    if (this.videoPlayer) {
      this.videoPlayer.srcObject = newStream;
      this.videoPlayer.style.setProperty("visibility", "visible");
    }
    if (height && width) {
      // this.videoPlayer!.width = Math.min( width, 1024 );
      // this.videoPlayer!.height = Math.min( height, 1024 );
    }
    this.updateCameraList();

    return newStream;
  }

  /**
   * Update the camera to use a device selected by the user.
   */
  updateCameraForDevice = (deviceId: string) => {
    this.updateCamera(videoConstraintsForDevice(deviceId));
  }

  /**
   * Update the list of cameras
   */
  updateCameraList = async () => {
    const listOfAllMediaDevices = await navigator.mediaDevices.enumerateDevices();
    const cameraList = await Promise.all(
      listOfAllMediaDevices
      // ignore all media devices except cameras
      .filter( ({kind}) => kind === 'videoinput' )
      // do parallel requests for user media to get camera data that
      // enumerateDevices doesn't offer, and can only be learned via getUserMedia 
      // .map( async camera => {
      //   const {deviceId, label, groupId, kind} = camera;
      //   const stream = await navigator.mediaDevices.getUserMedia(videoConstraintsForDevice(deviceId));
      //   const {height, width, facingMode, aspectRatio, frameRate} = stream?.getVideoTracks()[0]?.getSettings();
      //   // Don't keep any tracks from the stream since we're not actually going to look at it.
      //   stream.getTracks().forEach(track => track.stop() );
      //   return {deviceId, label, groupId, kind, height, width, facingMode, aspectRatio, frameRate};
      // })
    )
    if (cameraList.length === 1) {
      // There's only one camera option, so hide the camera-selection field.
      this.cameraSelectionMenu?.style.setProperty("visibility", "visible");
      return;
    }
    // const frontFacing = cameraList.filter( ({facingMode}) => facingMode === "user" );
    // const rearFacing = cameraList.filter( ({facingMode}) => facingMode === "environment" );
    // const hasNonDirectional = cameraList.length > frontFacing.length + rearFacing.length;
    // const currentlyFacing = cameraList.filter( ({deviceId}) => deviceId === this.camerasDeviceId )[0]?.facingMode;
    // const currentlyFacingFront = currentlyFacing === "user";
    // const currethlyFacingRear = currentlyFacing === "environment";
    // if (!hasNonDirectional && frontFacing.length > 0 && rearFacing.length === 0) {
    //   // Display switch with front-facing, rear-facing, and then list if more than one of current direction
    // }

    // Remove all child elements (select options)
    if (!this.cameraSelectionMenu) {
      return;
    }
    this.cameraSelectionMenu.innerHTML = '';
    // Replace old child elements with updated select options
    this.cameraSelectionMenu.append(...
      cameraList
        // turn the list of cameras into a list of menu options
        .map( (camera, index) => {
          const facingMode = undefined;
          const width = undefined;
          const height = undefined;
          const {deviceId, label} = camera; //, facingMode, width, height} = camera;
          const option = document.createElement('option');
          option.value = deviceId;
          option.appendChild(document.createTextNode(
            `${
              facingMode === "user" ? "Front Facing " :
              facingMode === "environment" ? "Rear Facing " :
              ""
            }${
              (width && height) ?
              `${width}x${height} ` : ""
            }${
              label || `Camera ${index + 1}`
            }`)); //  (${deviceId})
          return option;
        })
      );
    this.cameraSelectionMenu.value = this.camerasDeviceId || "";
    this.cameraSelectionMenu.style.setProperty("visibility", "visible");
    // Handle user selection of cameras
    this.cameraSelectionMenu.addEventListener("change", (_event) =>
      // The deviceID of the camera was stored in the value name of the option,
      // so it can be retrieved from the value field fo the select element
      this.updateCameraForDevice(this.cameraSelectionMenu?.value ?? "") );
  }


  getFrameUsingImageCapture = async (): Promise<Frame | undefined> => {
    const track = this.imageCapture?.track;
    if (track == null || track.readyState !== "live" || !track.enabled || track.muted) {
      if (track?.muted) {
        console.log("Track muted");
        track?.addEventListener("unmute", () => { console.log("Track unmuted"); } );
      }
      return;
    }
    const bitMap = await this.imageCapture!.grabFrame();
    const {width, height} = bitMap;
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
    const {width, height, rgbImageAsArrayBuffer, diceKeyReadJson, isFinished} = response;
    const {overlayCanvas} = this;
    if (overlayCanvas) {
      // Ensure the overlay canvas is the same size as the captured canvas
      if (overlayCanvas.width != width || overlayCanvas.height != height) {
        [overlayCanvas.width, overlayCanvas.height] = [width, height];
        // Ensure the overlay is lined up with the video frame
        const {left, top} =
          this.videoPlayer ?
            this.videoPlayer.getBoundingClientRect() :
          this.videoCanvas ?
            this.videoCanvas.getBoundingClientRect() :
          {left: 0, top: 0};
        overlayCanvas.style.setProperty("left", left.toString());
        overlayCanvas.style.setProperty("top", top.toString());
      }
      const overlayImageData = this.overlayCanvasCtx!.createImageData(width, height);
//      const overlayImageData = this.overlayCanvasCtx!.getImageData(0, 0, width, height);
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
      setTimeout(this.startProcessingNewCameraFrame, 0)
    }
  }
};
