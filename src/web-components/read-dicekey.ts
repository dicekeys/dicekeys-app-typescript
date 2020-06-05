import {
  HtmlComponent, HtmlComponentConstructorOptions
} from "./html-component"
import "regenerator-runtime/runtime";
import {
  FaceRead, FaceReadJson
} from "../dicekeys/face-read";
import {
  DiceKey
} from "../dicekeys/dicekey";

import {
    ProcessFrameRequest,
    ProcessFrameResponse,
    TerminateSessionRequest
} from "../workers/dicekey-image-frame-worker"


const  videoConstraintsForDevice = (deviceId: string): MediaStreamConstraints => ({
    video: {deviceId}
});


const componentHtml = `
<canvas id="overlay-canvas" class="overlay"></canvas>
<div class="content">
  <video id="player" controls autoplay></video>
</div>
<select id="camera-selection-menu"></select>
`;

/**
 * This class implements the demo page.
 */
export class ReadDiceKey extends HtmlComponent {
  private readonly frameWorker: Worker;
  private readonly captureCanvas: HTMLCanvasElement;
  private captureCanvasCtx: CanvasRenderingContext2D;
  private readonly overlayCanvas: HTMLCanvasElement;
  private overlayCanvasCtx: CanvasRenderingContext2D ;
  private readonly player: HTMLVideoElement;
  private readonly cameraSelectionMenu: HTMLSelectElement;
  private mediaStream: MediaStream | undefined;
  private cameraSessionId: string;

  public readonly promise: Promise<DiceKey>;
  private resolve?: (diceKey: DiceKey) => any;
  private reject?: (err: any) => any;
  
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    parentElement: HTMLElement,
    options: HtmlComponentConstructorOptions = {},
    private onRead?: (diceKey: DiceKey) => any,
    private onAbort?: () => any
  ) {
    super(parentElement, componentHtml, options);
    this.promise = new Promise<DiceKey>( (resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    })

    // Bind to HTML
    this.frameWorker = new Worker('../workers/dicekey-image-frame-worker.ts');
    this.captureCanvas = document.createElement("canvas") as HTMLCanvasElement;
    this.captureCanvasCtx = this.captureCanvas.getContext("2d")!;
    this.overlayCanvas = document.getElementById("overlay-canvas") as HTMLCanvasElement;
    this.overlayCanvasCtx = this.overlayCanvas.getContext("2d")!;
    this.player = document.getElementById('player') as HTMLVideoElement;
    this.cameraSelectionMenu = document.getElementById('camera-selection-menu') as HTMLSelectElement;
    this.mediaStream = undefined;
    this.cameraSessionId = Math.random().toString() + Math.random().toString();

    // Start out with the default camear
    this.updateCamera();
    // See what other cameras are available
    navigator.mediaDevices.enumerateDevices().then( this.updateCameraList );
    // Register a handler for responses to the requests will issue to the
    // web worker to process camera frames.
    this.frameWorker.addEventListener( "message", this.handleMessage );
    // Start processing frames from the camera
    //this.startProcessingNewCameraFrame();
  }

  
  destroy() {
    super.destroy();
    this.frameWorker.postMessage({action: "terminateSession", sessionId: this.cameraSessionId} as TerminateSessionRequest);
    // If there's an existing stream, terminate it
    this.mediaStream?.getTracks().forEach(track => track.stop() );
    setTimeout( () => this.frameWorker.terminate(), 1000);
  }

  
  private readyReceived: boolean = false;
  handleMessage = (message: MessageEvent) => {
    if (!this.readyReceived && "action" in message.data && message.data.action === "workerReady" ) {
      this.readyReceived = true;
      this.onReady();
    } else if ("action" in message.data && message.data.action == "process") {
      this.handleProcessedCameraFrame(message.data as ProcessFrameResponse)
    }
  }

  onReady = () => {
    this.startProcessingNewCameraFrame();
  }
  
  /**
   * Set the current camera
   */
  updateCamera = (mediaStreamConstraints: MediaStreamConstraints = {video: true}) => {
    navigator.mediaDevices.getUserMedia(mediaStreamConstraints).then((newStream) => {
      const oldMediaStream = this.mediaStream;
      // If there's an existing stream, terminate it
      this.mediaStream?.getTracks().forEach(track => track.stop() );
      // Now set the new stream
      this.player.srcObject = this.mediaStream = newStream;
    });  
  }

  /**
   * Update the camera to use a device selected by the user.
   */
  updateCameraForDevice = (deviceId: string) =>
    this.updateCamera(videoConstraintsForDevice(deviceId));

  /**
   * Update the list of cameras
   */
  updateCameraList = (listOfAllMediaDevices: MediaDeviceInfo[]) => {
    // Remove all child elements (select options)
    this.cameraSelectionMenu.innerHTML = '';
    // Replace old child elements with updated select options
    this.cameraSelectionMenu.append(...
      listOfAllMediaDevices
        // ignore all media devices except cameras
        .filter( ({kind}) => kind === 'videoinput' )
        // turn the list of cameras into a list of menu options
        .map( (camera, index) => {
          const option = document.createElement('option');
          option.value = camera.deviceId;
          option.appendChild(document.createTextNode(camera.label || `Camera ${index + 1}`));
          return option;
        })
      );
    // Handle user selection of cameras
    this.cameraSelectionMenu.addEventListener("change", (event) =>
      // The deviceID of the camera was stored in the value name of the option,
      // so it can be retrieved from the value field fo the select element
      this.updateCameraForDevice(this.cameraSelectionMenu.value) );
  }

  /**
   * To process video images, we will loop through retrieving camera frames with
   * this meethod, calling a webworker to process the frames, and then
   * the web worker's response will trigger handleProcessedCameraFrame (below),
   * which will call back to here.
   */
  startProcessingNewCameraFrame = () => {
      if (this.player.videoWidth == 0 || this.player.videoHeight == 0) {
          // There's no need to take action if there's no video
          setTimeout(this.startProcessingNewCameraFrame, 100);
          return;
      }
      // Ensure the capture canvas is the size of the video being retrieved
      if (this.captureCanvas.width != this.player.videoWidth || this.captureCanvas.height != this.player.videoHeight) {
          [this.captureCanvas.width, this.captureCanvas.height] = [this.player.videoWidth, this.player.videoHeight];
          this.captureCanvasCtx = this.captureCanvas.getContext("2d")!;
      }
      this.captureCanvasCtx!.drawImage(this.player, 0, 0);
      const {width, height, data} = this.captureCanvasCtx!.getImageData(0, 0, this.captureCanvas.width, this.captureCanvas.height);

      // Ask the background worker to process the bitmap.
      // First construct a requeest
      const request: ProcessFrameRequest = {
          action: "processImageFrame",
          sessionId: this.cameraSessionId,
          width, height,
          rgbImageAsArrayBuffer: data.buffer
      };
      // The mark the objects that can be transffered to the worker.
      // This eliminates the need to copy the big memory buffer over, but the worker will now own the memory.
      const transferrableObjectsWithinRequest: Transferable[] =  [request.rgbImageAsArrayBuffer];
      // Send the request to the worker
      this.frameWorker.postMessage(request, transferrableObjectsWithinRequest);
  }

  /**
   * Handle frames processed by the web worker, displaying the received
   * overlay image above the video image.
   */
  handleProcessedCameraFrame = (response: ProcessFrameResponse) => {
      const {width, height, overlayImageBuffer, diceKeyReadJson, isFinished} = response;
      // Ensure the overlay canvas is the same size as the captured canvas
      if (this.overlayCanvas.width != width || this.overlayCanvas.height != height) {
          [this.overlayCanvas.width, this.overlayCanvas.height] = [width, height];
          this.overlayCanvasCtx = this.overlayCanvas.getContext("2d")!;
          // Ensure the overlay is lined up with the video frame
          const {left, top} = this.player.getBoundingClientRect()
          this.overlayCanvas.style.setProperty("left", left.toString());
          this.overlayCanvas.style.setProperty("top", top.toString());
      }        
      const overlayImageData = this.overlayCanvasCtx!.getImageData(0, 0, width, height);
      overlayImageData.data.set(new Uint8Array(overlayImageBuffer));
      this.overlayCanvasCtx!.putImageData(overlayImageData, 0, 0);

      if (isFinished) {
        this.destroy();

        const diceKey = DiceKey(
          (JSON.parse(diceKeyReadJson) as FaceReadJson[])
          .map( FaceRead.fromJson )
          .map( faceRead => faceRead.toFace() )
        );
        this.onRead?.(diceKey);
        this.resolve?.(diceKey);

      } else {
          setTimeout(this.startProcessingNewCameraFrame, 0)
      }
  
  }
};
