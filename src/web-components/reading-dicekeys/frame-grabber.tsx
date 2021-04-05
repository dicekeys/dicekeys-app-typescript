import { action, makeAutoObservable } from "mobx";
import { withDefined } from "../../utilities/if-defined";


export class FrameGrabber {
  /**
   * A re-usable canvas into which to capture image frames
   */
  private readonly captureCanvas: HTMLCanvasElement = document.createElement("canvas");
  private captureCanvasCtx?: CanvasRenderingContext2D = this.captureCanvas.getContext("2d")!;

  private videoElement?: HTMLVideoElement;

  setVideoElement = action((videoElement?: HTMLVideoElement) => {
    this.videoElement = videoElement;
  });

  private frameGrabCallback?: (frame: ImageData) => any = undefined;

  setCallback = action((callback?: (frame: ImageData) => any) => {
    this.frameGrabCallback = callback;
    if (callback) {
      withDefined(this.timeout, timeout => clearTimeout(timeout));
      this.frameGrabLoopIteration();
    }
  });

  constructor(callback?: (frame: ImageData) => any) {
    makeAutoObservable(this);
    this.setCallback(callback);
  }

  private readonly msToWaitOnFailure = 100;
  private readonly msToWaitOnSuccess = 1;

  private frameBeingReadOrProcessed: boolean = false;
  private timeout?: number;

  private completeFrameGrabAndStartNextAfterDelayOf = (delayInMs: number) => {
    withDefined(this.timeout, timeout => {
      clearTimeout(timeout);
      this.timeout = undefined;
    });
    this.frameBeingReadOrProcessed = false;
    this.timeout = setTimeout(this.frameGrabLoopIteration, delayInMs) as any as number;
  };

  private getFrameFromVideoPlayer = (): ImageData | undefined => {
    if (!this.videoElement) {
      return;
    }
    if (this.videoElement!.videoWidth == 0 || this.videoElement!.videoHeight == 0) {
      // There's no need to take action if there's no video
      return;
    }

    // Ensure the capture canvas is the size of the video being retrieved
    if (this.captureCanvas!.width != this.videoElement!.videoWidth || this.captureCanvas!.height != this.videoElement!.videoHeight) {
      [this.captureCanvas!.width, this.captureCanvas!.height] = [this.videoElement!.videoWidth, this.videoElement!.videoHeight];
      this.captureCanvasCtx = this.captureCanvas!.getContext("2d")!;
    }
    this.captureCanvasCtx!.drawImage(this.videoElement!, 0, 0);
    return this.captureCanvasCtx!.getImageData(0, 0, this.captureCanvas!.width, this.captureCanvas!.height);
  };

  private frameGrabFailed = () => this.completeFrameGrabAndStartNextAfterDelayOf(this.msToWaitOnFailure);

  private frameGrabSucceeded = (msToWait: number = this.msToWaitOnSuccess) => this.completeFrameGrabAndStartNextAfterDelayOf(msToWait);

  private frameGrabLoopIteration = async () => {
    if (this.frameBeingReadOrProcessed) {
      return;
    }
    withDefined(this.timeout, timeout => {
      clearTimeout(timeout); this.timeout = undefined;
    });
    const callback = this.frameGrabCallback;
    if (!callback) { return; }
    if (!this.videoElement)
      return this.frameGrabFailed();
    const frame = this.getFrameFromVideoPlayer();
    if (!frame)
      return this.frameGrabFailed();
    try {
      await callback(frame);
      if (!frame)
        return this.frameGrabFailed();
    } catch {
      return this.frameGrabFailed();
    }
    return this.frameGrabSucceeded();
  };
}
