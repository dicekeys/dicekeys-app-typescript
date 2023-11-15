// import { action, makeAutoObservable } from "mobx";
import { throwIfNull } from "../../utilities/throwIfNull";
import { withDefined } from "../../utilities/with-defined";


export class FrameGrabberFromVideoElement {
  /**
   * A re-usable canvas into which to capture image frames
   */
  private readonly captureCanvas: HTMLCanvasElement;
  private captureCanvasCtx: CanvasRenderingContext2D;

  constructor(private videoElement: HTMLVideoElement, private callback: (frame: ImageData) => void) {
    this.captureCanvas = document.createElement("canvas");
    this.captureCanvas.setAttribute("willReadFrequently", "true")
    this.captureCanvasCtx = throwIfNull(this.captureCanvas.getContext("2d"));
    this.frameGrabLoopIteration();
  }

  private readonly msToWaitOnFailure = 100;
  private readonly msToWaitOnSuccess = 1;

  private frameBeingReadOrProcessed: boolean = false;
  private timeout?: ReturnType<typeof setTimeout>;

  private completeFrameGrabAndStartNextAfterDelayOf = (delayInMs: number) => {
    withDefined(this.timeout, timeout => {
      clearTimeout(timeout);
      this.timeout = undefined;
    });
    this.frameBeingReadOrProcessed = false;
    this.timeout = setTimeout(this.frameGrabLoopIteration, delayInMs)
  };

  private getFrameFromVideoPlayer = (): ImageData | undefined => {
    if (this.videoElement.videoWidth == 0 || this.videoElement.videoHeight == 0) {
      // There's no need to take action if there's no video
      return;
    }

    // Ensure the capture canvas is the size of the video being retrieved
    if (this.captureCanvas.width != this.videoElement.videoWidth || this.captureCanvas.height != this.videoElement.videoHeight) {
      [this.captureCanvas.width, this.captureCanvas.height] = [this.videoElement.videoWidth, this.videoElement.videoHeight];
      this.captureCanvasCtx = throwIfNull(this.captureCanvas.getContext("2d"));
    }
    this.captureCanvasCtx.drawImage(this.videoElement, 0, 0);
    return this.captureCanvasCtx.getImageData(0, 0, this.captureCanvas.width, this.captureCanvas.height);
  };

  private frameGrabFailed = () =>
    this.completeFrameGrabAndStartNextAfterDelayOf(this.msToWaitOnFailure);

  private frameGrabSucceeded = (msToWait: number = this.msToWaitOnSuccess) =>
    this.completeFrameGrabAndStartNextAfterDelayOf(msToWait);

  private frameGrabLoopIteration = async () => {
    if (this.frameBeingReadOrProcessed) return;
    this.frameBeingReadOrProcessed = true;
    withDefined(this.timeout, timeout => {
      clearTimeout(timeout); this.timeout = undefined;
    });
    const frame = this.getFrameFromVideoPlayer();
    if (frame == null) return this.frameGrabFailed();
    try {
      await this.callback(frame);
    } catch {}
    return this.frameGrabSucceeded();
  };
}
