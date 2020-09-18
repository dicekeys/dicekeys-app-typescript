import dialogStyles from "../dialog.module.css";
import styles from "./camera-capture.module.css";
import {
  getElementDimensions,
  Component, Attributes,
  Canvas,
  Div,
  Select,
  Option,
  Video
} from "../../web-component-framework";
import {
  CamerasBeingInspected
} from "./cameras-being-inspected";
import {
  Camera,
  CamerasOnThisDevice,
  videoConstraintsForDevice
} from "./cameras-on-this-device";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

export interface CameraCaptureOptions extends Attributes {
  maxWidth?: number;
  maxHeight?: number;
  fixAspectRatioToWidthOverHeight?: number;
}

/**
 * This component scans scans images using the device camera(s).
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
export class CameraCapture extends Component<CameraCaptureOptions> {
  /**
   * This separate module tracks the cameras attached to the device
   */
  private readonly camerasBeingInspected: CamerasBeingInspected = new CamerasBeingInspected({});

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
  public get isRenderedOverVideo(): boolean {return !this.useImageCapture };

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

  private cameraSelectionMenu?: HTMLSelectElement;
  private get videoPlayer() {return this.videoComponent?.primaryElement}
  
  /**
   * A re-usable canvas into which to capture image frames
   */
  private readonly captureCanvas: HTMLCanvasElement = document.createElement("canvas");
  private captureCanvasCtx?: CanvasRenderingContext2D = this.captureCanvas.getContext("2d")!;

  /**
   * The media stream from the current camera
   */
  private mediaStream?: MediaStream;

  /**
   * The ImageCapture object used to grab frames from the camera
   * (not supported by all browsers.  We fallback to rendering
   * to a video element and then capturing frames out of the
   * video rendered to the screen.)
   */
  private imageCapture?: ImageCapture;

  // Set to true when the first frame has been drawn.
  // Allows us to draw first ImageCapture frame loaded without delay.
  private hasAnImageBeenDrawnOntoTheOverlayCanvas = false;
  
  
  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: CameraCaptureOptions
  ) {
    super(options);

    //
    // Initialize the list of device cameras
    CamerasOnThisDevice.instance.cameraListUpdated.on( (cameras) => {
      // Whenever there's an update to the camera list, if we don't have an
      // active camera, set the active camera to the first camera in the list.
      if (!this.mediaStream && cameras.length > 0) {
        // no longer need to show the list of cameras
        this.camerasBeingInspected?.remove()
        this.setCamera(cameras[0].deviceId);
      }
      // And update the rendered camera list
      this.renderCameraList(cameras);
    })
    if (CamerasOnThisDevice.instance.cameras.length > 0) {
      this.setCamera(CamerasOnThisDevice.instance.cameras[0].deviceId);
    } 
  }

  
  /**
   * Update the selection menu of cameras
   */
  renderCameraList = (cameras: Camera[] = CamerasOnThisDevice.instance.cameras) => {
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

  render() {
    super.render();
    this.append(
      Div({class: "content"},
        CamerasOnThisDevice.instance.cameras.length == 0 ? this.camerasBeingInspected : undefined,
        Canvas(this.useImageCapture ? {} :{class: styles.overlay}).with( c => this.overlayCanvasComponent = c ),
        Video({style: "display: none; visibility: hidden;"}).with( c => this.videoComponent = c ),
      ),
      Div({class: dialogStyles.centered_controls},
        Select({style: "visibility: hidden;"}).withElement( e => this.cameraSelectionMenu = e )
      ),
    );
  }

  remove() {
    if (!super.remove()) {
      // This element has already been removed
      return false;
    }
    // If there's an existing stream, terminate it
    this.mediaStream?.getTracks().forEach( track => track.readyState === "live" && track.enabled && track.stop() );
    this.mediaStream = undefined;
    // remove successful
    return true;
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

  private getFrameUsingImageCapture = async (): Promise<ImageData | undefined> => {
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
    if (this.overlayCanvas && !this.isRenderedOverVideo && !this.hasAnImageBeenDrawnOntoTheOverlayCanvas) {
      this.drawImageDataOntoVideoCanvas(bitMap);
    }
    console.log("Frame grabbed", (Date.now() % 100000) / 1000);
    const {width, height} = bitMap;
    console.log(`Grabbing frame with dimensions ${width}x${height}`)
    if (this.captureCanvas!.width != width || this.captureCanvas!.height != height) {
      [this.captureCanvas!.width, this.captureCanvas!.height] = [width, height];
      this.captureCanvasCtx = this.captureCanvas!.getContext("2d")!;
    }
    this.captureCanvasCtx!.drawImage(bitMap, 0, 0);
    return this.captureCanvasCtx!.getImageData(0, 0, width, height);
  };

  private getFrameFromVideoPlayer = (): ImageData | undefined => {
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
    return this.captureCanvasCtx!.getImageData(0, 0, this.captureCanvas!.width, this.captureCanvas!.height);
  }

  private getFrameOrUndefinedIfNotReady = async (): Promise<ImageData | undefined> => {
    if (this.removed) {
      // The element is no longer displaying and so processing should stop.
      throw new Error("Can't grab frame because the CameraCapture component has been removed");
    }
    return await (this.useImageCapture ?
      this.getFrameUsingImageCapture() : this.getFrameFromVideoPlayer());
  }

  getFrame = async (): Promise<ImageData> => {
    const imageData = await this.getFrameOrUndefinedIfNotReady();
    if (imageData != null) {
      return imageData;
    }
    return await new Promise<ImageData>( (resolve, reject) => {
      var interval: ReturnType<typeof setInterval> | undefined;
      const complete = () => {
        const notYetComplete = interval != null;
        if (notYetComplete) {
          clearInterval(interval!);
          interval = undefined;
        }
        return notYetComplete;
      }
      interval = setInterval( async () => {
        try {
          const imageData = await this.getFrameOrUndefinedIfNotReady();
          if (imageData != null && complete()) {
            resolve (imageData);
          }
        } catch (e) {
          if (complete()) {
            reject(e);
          }
        }
      }, 100);
    });
  }

  private canvasForDrawImageDataOntoVideoCanvas: HTMLCanvasElement | undefined;
  private ctxForDrawImageDataOntoVideoCanvas: CanvasRenderingContext2D | undefined;
  drawImageDataOntoVideoCanvas = (imageDataOrBitmap: ImageData | ImageBitmap) => {
    if (!this.overlayCanvas) {
      return;
    }
    const ctx = this.overlayCanvasCtx;
    if (!ctx) return;

    if (imageDataOrBitmap instanceof ImageData) {
      if (this.canvasForDrawImageDataOntoVideoCanvas == null || this.ctxForDrawImageDataOntoVideoCanvas == null) {
        this.canvasForDrawImageDataOntoVideoCanvas = document.createElement("canvas");
        this.ctxForDrawImageDataOntoVideoCanvas = this.canvasForDrawImageDataOntoVideoCanvas.getContext("2d")!;
      }
      if (this.canvasForDrawImageDataOntoVideoCanvas.width !== imageDataOrBitmap.width) {
        this.canvasForDrawImageDataOntoVideoCanvas.setAttribute("width", imageDataOrBitmap.width.toString());
      }
      if (this.canvasForDrawImageDataOntoVideoCanvas.height !== imageDataOrBitmap.height) {
        this.canvasForDrawImageDataOntoVideoCanvas.setAttribute("height", imageDataOrBitmap.height.toString());
      }
      this.ctxForDrawImageDataOntoVideoCanvas.putImageData(imageDataOrBitmap, 0, 0);
    }
    const canvasOrBitmap = (imageDataOrBitmap instanceof ImageData) ?
      this.canvasForDrawImageDataOntoVideoCanvas! : imageDataOrBitmap;
    if (!this.imageCapture) {
      // We're drawing an overlay, so we need to clear the canvas first.
      ctx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
      this.overlayCanvas.style.setProperty("left",this.overlayCanvas.parentElement!.offsetLeft.toString())
      this.overlayCanvas.style.setProperty("top",this.overlayCanvas.parentElement!.offsetTop.toString())
    }

    // Match the canvas size to the video player since we're overlaying above it.
    const rect = getElementDimensions(
        (this.videoPlayer && this.videoPlayer.style.getPropertyValue("display") !== "none") ?
          this.videoPlayer:
          this.overlayCanvas!.parentElement!
      );
    var {width, height} = rect;

      // Match the canvas size to the video frame
    const {
      maxWidth = window.innerWidth,
      maxHeight = window.innerHeight * 7 /8,
    } = this.options;
    width = Math.min(imageDataOrBitmap.width, maxWidth);
    height = Math.min(imageDataOrBitmap.height, maxHeight);
    const {fixAspectRatioToWidthOverHeight} = this.options;
    if (fixAspectRatioToWidthOverHeight != null) {
      if (Math.floor(width / fixAspectRatioToWidthOverHeight) > height) {
        // The width is too large for the aspect ratio
        // and should be reduced to match the height
        width = Math.floor(height * fixAspectRatioToWidthOverHeight);
      } else if (Math.floor(height * fixAspectRatioToWidthOverHeight) > width) {
        // The height is too large for the aspect ratio and should ge reduced
        // to match the max width
        height = Math.floor(width / fixAspectRatioToWidthOverHeight);
      }
    }
    if (this.overlayCanvas.width !== width || this.overlayCanvas.height !== height) {
      this.overlayCanvas.setAttribute("width", width.toString());
      this.overlayCanvas.setAttribute("height", height.toString());
      this.overlayCanvas.width = width;
      this.overlayCanvas.height = height;
    }
    const canvasAspectRatioAsWidthOverHeight = ctx.canvas.width / ctx.canvas.height;
    const srcWidthOverHeight = width / height;
    const [srcWidth, srcHeight] = canvasAspectRatioAsWidthOverHeight > srcWidthOverHeight ?
      // The canvas is too wide for the source (the captured frame), so reduce the source's height
      // to make the source relatively wider
      [width, width / canvasAspectRatioAsWidthOverHeight] :
      // The canvas is too tall for the source (the captured frame), so reduce the source's width
      // to make it relatively taller
      [height * canvasAspectRatioAsWidthOverHeight, height];
    const srcX = (width - srcWidth) / 2;
    const srcY = (height - srcHeight) / 2;
    this.hasAnImageBeenDrawnOntoTheOverlayCanvas = true;
  
    ctx.drawImage(canvasOrBitmap, srcX, srcY, srcWidth, srcHeight, 0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
  }


};
