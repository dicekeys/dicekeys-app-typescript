import { action, makeAutoObservable } from "mobx";

export class MediaStreamState {
  public _deviceId: string | undefined;
  get deviceId(): string | undefined { return this._deviceId }
  private _mediaStream?: MediaStream;

  get mediaStream(): MediaStream | undefined {
    return this._mediaStream ?? undefined;
  }

  clear = action (() => {
    this._deviceId = undefined;
    if (this._mediaStream) {
      this._mediaStream?.getVideoTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      try {this._mediaStream.stop?.()} catch {}
      this._mediaStream = undefined;
    }
  });

  private setDeviceIdAndMediaStream = action ((deviceId?: string, mediaStream?: MediaStream) => {
    if (this._mediaStream === mediaStream) return;
    this.clear();
    this._deviceId = deviceId;
    this._mediaStream = mediaStream;
  });

  setDeviceId = async (deviceId?: string) => {
    if (deviceId == null) {
      this.clear();
      return;
    }
    this._deviceId = deviceId;
    const mediaTrackConstraints: MediaTrackConstraints = {
      ...this.defaultMediaTrackConstraints,
      deviceId,
    };
    const mediaStream = await navigator.mediaDevices.getUserMedia({video: mediaTrackConstraints});
    this.setDeviceIdAndMediaStream(deviceId, mediaStream);
  }

  constructor(private defaultMediaTrackConstraints: MediaTrackConstraints) {
    makeAutoObservable(this);
  }
}