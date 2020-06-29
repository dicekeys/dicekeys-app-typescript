import {
  ComponentEvent
} from "./component-event"
import {
  HtmlComponent
} from "./html-component"
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
    TerminateSessionRequest
} from "../workers/dicekey-image-frame-worker"


const  videoConstraintsForDevice = (deviceId: string): MediaStreamConstraints => ({
  video: {
    deviceId,
    width: { ideal: 1024 },
    height: { ideal: 1024 },
  },
});

interface ReadDiceKeyOptions {
  msDelayBetweenSuccessAndClosure?: number;
}

/**
 * This class implements the demo page.
 */
export class ScanDiceKey extends HtmlComponent<ReadDiceKeyOptions> {
  private static readonly overlayCanvasId = "overlay-canvas";
  private static readonly playerId = "player";
  private static readonly cameraSelectionMenuId = "camera-selection-menu";

  private get cameraSelectionMenu() {return document.getElementById(ScanDiceKey.cameraSelectionMenuId) as HTMLSelectElement;}
  private get overlayCanvas() {return document.getElementById(ScanDiceKey.overlayCanvasId) as HTMLCanvasElement;}
  private get overlayCanvasCtx() {return this.overlayCanvas.getContext("2d")!};
  private get player() {return document.getElementById(ScanDiceKey.playerId) as HTMLVideoElement;}
  
  private readonly frameWorker: Worker;

  private captureCanvas?: HTMLCanvasElement;
  private captureCanvasCtx?: CanvasRenderingContext2D;
  private mediaStream?: MediaStream;
  private cameraSessionId?: string;
  
  // Events
  public readonly diceKeyLoadedEvent = new ComponentEvent<[DiceKey], ScanDiceKey>(this);

  public get msDelayBetweenSuccessAndClosure(): number {
    return this.options.msDelayBetweenSuccessAndClosure == null ?
      500 // Default delay of 500 seconds
      :
      this.options.msDelayBetweenSuccessAndClosure;
  }

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: ReadDiceKeyOptions = {}
  ) {
    super(options);
    this.frameWorker = new Worker('../workers/dicekey-image-frame-worker.ts');
  }

  render() {
    super.render();
    this.appendHtml(`
      <canvas id="${ScanDiceKey.overlayCanvasId}" class="overlay"></canvas>
      <div class="content">
        <video id="${ScanDiceKey.playerId}" controls autoplay></video>
      </div>
      <select id="${ScanDiceKey.cameraSelectionMenuId}"></select>
    `);
    this.captureCanvas = document.createElement("canvas") as HTMLCanvasElement;
    this.captureCanvasCtx = this.captureCanvas.getContext("2d")!;

    // Bind to HTML
    this.player.style.setProperty("display", "none");
    this.cameraSelectionMenu.style.setProperty("display", "none");
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
    this.mediaStream?.getTracks().forEach(track => track.stop() );
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
    } else if ("action" in message.data && message.data.action == "process") {
      this.handleProcessedCameraFrame(message.data as ProcessFrameResponse)
    }
  }

  onWorkerReady = () => {
    this.startProcessingNewCameraFrame();
  }

  defaultVideoConstraints: MediaStreamConstraints = {video: {
    width: { ideal: 1024, min: 768 },
    height: { ideal: 1024, min: 768 },
    facingMode: "environment" // "user" (faces the user) | "environment" (away from user)
  }}
  camerasDeviceId: string | undefined;
  /**
   * Set the current camera
   */
  updateCamera = async (
    mediaStreamConstraints: MediaStreamConstraints = this.defaultVideoConstraints
  ): Promise<MediaStream> => {
    const newStream = await navigator.mediaDevices.getUserMedia(mediaStreamConstraints);
    const oldMediaStream = this.mediaStream;
    // If there's an existing stream, terminate it
    oldMediaStream?.getTracks().forEach(track => track.stop() );
    // Now set the new stream
    this.mediaStream = newStream;
    const {
      deviceId, height, width,
      // facingMode, aspectRatio, frameRate
    } = this.mediaStream?.getVideoTracks()[0]?.getSettings();
    this.camerasDeviceId = deviceId;
    this.player!.style.removeProperty("display");
    this.player!.srcObject = this.mediaStream = newStream;
    if (height && width) {
      this.player!.width = Math.min( width, 1024 );
      this.player!.height = Math.min( height, 1024 );
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
      this.cameraSelectionMenu!.style.setProperty("display", "none");
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
    this.cameraSelectionMenu!.innerHTML = '';
    // Replace old child elements with updated select options
    this.cameraSelectionMenu!.append(...
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
    this.cameraSelectionMenu!.value = this.camerasDeviceId || "";
    this.cameraSelectionMenu!.style.removeProperty("display");
    // Handle user selection of cameras
    this.cameraSelectionMenu!.addEventListener("change", (_event) =>
      // The deviceID of the camera was stored in the value name of the option,
      // so it can be retrieved from the value field fo the select element
      this.updateCameraForDevice(this.cameraSelectionMenu!.value) );
  }

  /**
   * To process video images, we will loop through retrieving camera frames with
   * this meethod, calling a webworker to process the frames, and then
   * the web worker's response will trigger handleProcessedCameraFrame (below),
   * which will call back to here.
   */
  startProcessingNewCameraFrame = () => {
    if (this.player!.videoWidth == 0 || this.player!.videoHeight == 0) {
        // There's no need to take action if there's no video
        setTimeout(this.startProcessingNewCameraFrame, 100);
        return;
    }
    // Ensure the capture canvas is the size of the video being retrieved
    if (this.captureCanvas!.width != this.player!.videoWidth || this.captureCanvas!.height != this.player!.videoHeight) {
        [this.captureCanvas!.width, this.captureCanvas!.height] = [this.player!.videoWidth, this.player!.videoHeight];
        this.captureCanvasCtx = this.captureCanvas!.getContext("2d")!;
    }
    this.captureCanvasCtx!.drawImage(this.player!, 0, 0);
    const {width, height, data} = this.captureCanvasCtx!.getImageData(0, 0, this.captureCanvas!.width, this.captureCanvas!.height);

    // Ask the background worker to process the bitmap.
    // First construct a requeest
    const request: ProcessFrameRequest = {
      action: "processImageFrame",
      sessionId: this.cameraSessionId!,
      width, height,
      rgbImageAsArrayBuffer: data.buffer
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
  handleProcessedCameraFrame = (response: ProcessFrameResponse) => {
    const {width, height, overlayImageBuffer, diceKeyReadJson, isFinished} = response;
    // Ensure the overlay canvas is the same size as the captured canvas
    if (this.overlayCanvas.width != width || this.overlayCanvas.height != height) {
      [this.overlayCanvas.width, this.overlayCanvas.height] = [width, height];
      // Ensure the overlay is lined up with the video frame
      const {left, top} = this.player!.getBoundingClientRect()
      this.overlayCanvas.style.setProperty("left", left.toString());
      this.overlayCanvas.style.setProperty("top", top.toString());
    }        
    const overlayImageData = this.overlayCanvasCtx.getImageData(0, 0, width, height);
    overlayImageData.data.set(new Uint8Array(overlayImageBuffer));
    this.overlayCanvasCtx.putImageData(overlayImageData, 0, 0);

    if (isFinished && !this.finishDelayInProgress) {
      const diceKey = DiceKey(
        (JSON.parse(diceKeyReadJson) as FaceReadJson[])
        .map( FaceRead.fromJson )
        .map( faceRead => faceRead.toFace() )
      );
      DiceKeyAppState.instance!.diceKey = diceKey;
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
