import { action, makeAutoObservable } from "mobx";
import { CamerasOnThisDevice } from "./CamerasOnThisDevice";

export class MediaStreamState {
  public _deviceId: string | undefined;
  get deviceId(): string | undefined { return this._deviceId }

  private _mediaStream?: MediaStream;
  get mediaStream(): MediaStream | undefined {
    return this._mediaStream ?? undefined;
  }

  private _supportsFixedFocus: boolean = false;
  get supportsFixedFocus() { return this._supportsFixedFocus }

  clear = action (() => {
    this._deviceId = undefined;
    this._supportsFixedFocus = false;
    if (this._mediaStream != null) {
      this._mediaStream?.getVideoTracks().forEach(track => {
        try { track.stop(); } catch {}
      });
      try {this._mediaStream.stop?.()} catch {}
      this._mediaStream = undefined;
    }
  });

  private setDeviceIdAndMediaStream = action ((deviceId: string, mediaStream: MediaStream, supportsFixedFocus: boolean) => {
    if (this._mediaStream === mediaStream) return;
    this.clear();
    this._deviceId = deviceId;
    this._mediaStream = mediaStream;
    this._supportsFixedFocus = supportsFixedFocus;
  });

  setDeviceId = async (deviceId?: string) => {
    if (deviceId == null) {
      this.clear();
      return;
    }
    const camera = CamerasOnThisDevice.instance.camerasByDeviceId.get(deviceId);
    if (camera != null) {
      // console.log("Setting camera with capabilities ", {...camera.capabilities}, JSON.stringify(camera.capabilities))
    }
    // Test if the camera supports manual focus and, if set, set focal distance to up-close
    const minFocusDistance = camera?.capabilities?.focusDistance?.min;
    const supportsFixedFocus = minFocusDistance != null && 
      (camera?.capabilities?.focusMode ?? []).indexOf("manual") !== -1;
    const focusConstraints = supportsFixedFocus && minFocusDistance == null ? {} : {
      advanced: [{focusMode: "manual", focusDistance: {ideal: minFocusDistance, max: minFocusDistance}}]
    }
    const mediaTrackConstraints: MediaTrackConstraints = {
      ...this.defaultMediaTrackConstraints,
      ...focusConstraints,
      deviceId,
    };
    const mediaStream = await navigator.mediaDevices.getUserMedia({video: mediaTrackConstraints});
    this.setDeviceIdAndMediaStream(deviceId, mediaStream, supportsFixedFocus);
  }

  constructor(private defaultMediaTrackConstraints: MediaTrackConstraints) {
    makeAutoObservable(this);
  }
}