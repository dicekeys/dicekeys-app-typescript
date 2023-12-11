import { throwIfNull } from "../../utilities/throwIfNull";
import { withDefined } from "../../utilities/with-defined";


export class FrameGrabberUsingImageCapture {
  /**
   * A re-usable canvas into which to capture image frames
   */
  private readonly captureCanvas: HTMLCanvasElement = document.createElement("canvas");
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  private captureCanvasCtx: CanvasRenderingContext2D = this.captureCanvas.getContext("2d", {willReadFrequently: true})!;

  imageCapture: ImageCapture;

  constructor(videoTrack: MediaStreamTrack, private callback: (frame: ImageData) => void) {
    this.imageCapture = new ImageCapture(videoTrack);
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
    this.timeout = setTimeout(this.frameGrabLoopIteration, delayInMs);
  };

  private getFrame = async (): Promise<ImageData | undefined> => {
    const track = this.imageCapture?.track;
    if (track == null || track.readyState !== "live" || !track.enabled || track.muted) {
      if (track?.muted) {
        console.log("Track muted");
        // For some reason, if we don't read enough frames fast enough, browser may mute the
        // track.  If they do, just re-open the camera.
        track?.addEventListener("unmute", () => { console.log("Track unmuted"); } );
      }
      return;
    }
    try {
      const bitMap = await this.imageCapture.grabFrame();
      if (bitMap == null) return;
      const {width, height} = bitMap;
      // console.log(`Grabbing frame with dimensions ${width}x${height}`)
      if (this.captureCanvas.width != width || this.captureCanvas.height != height) {
        [this.captureCanvas.width, this.captureCanvas.height] = [width, height];
        this.captureCanvasCtx = throwIfNull(this.captureCanvas.getContext("2d"));
      }
      this.captureCanvasCtx.drawImage(bitMap, 0, 0);
      return this.captureCanvasCtx.getImageData(0, 0, width, height);
    } catch {
      return;
    }
  };

  private frameGrabFailed = () =>
    this.completeFrameGrabAndStartNextAfterDelayOf(this.msToWaitOnFailure);

  private frameGrabSucceeded = (msToWait: number = this.msToWaitOnSuccess) =>
    this.completeFrameGrabAndStartNextAfterDelayOf(msToWait);

  private frameGrabLoopIteration = async () => {
    if (this.frameBeingReadOrProcessed) {
      return;
    }
    this.frameBeingReadOrProcessed = true;
    withDefined(this.timeout, timeout => {
      clearTimeout(timeout); this.timeout = undefined;
    });
    try {
      const frame = await this.getFrame();
      if (frame != null) {
        try {
          await this.callback(frame)
        } catch {
          /* If the callback fails, it's not our problem.  The frame capture was still a success.  Carry on. */
        }
        return this.frameGrabSucceeded();
      }
    } catch {}
    return this.frameGrabFailed();
  };
}
