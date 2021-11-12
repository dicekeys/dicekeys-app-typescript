import { action, makeAutoObservable } from "mobx";
import type { Camera, CamerasOnThisDevice } from "./CamerasOnThisDevice";

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

  get defaultDevice(): Camera | undefined { return this.camerasOnThisDevice.cameras[0] }

  setCamera = async(camera: Camera) => {
    const {deviceId, capabilities} = camera;
    // Test if the camera supports manual focus and, if set, set focal distance to up-close
    const minFocusDistance = capabilities?.focusDistance?.min;
    const supportsFixedFocus = minFocusDistance != null && 
      (capabilities?.focusMode ?? []).indexOf("manual") !== -1;
    const focusConstraints = supportsFixedFocus && minFocusDistance == null ? {} : {
      advanced: [{focusMode: "manual", focusDistance: {ideal: minFocusDistance, max: minFocusDistance}}]
    }
    const mediaTrackConstraints: MediaTrackConstraints = {
      ...this.defaultMediaTrackConstraints,
      ...focusConstraints,
      deviceId,
    };
    const mediaStream = await (async () => {
      try {
        return await navigator.mediaDevices.getUserMedia({video: mediaTrackConstraints});
      } catch (e) {
        if (e instanceof OverconstrainedError) {
          console.log("Camera Overconstrained", deviceId, mediaTrackConstraints);
        }
        throw e;
    }})();
    console.log("Camera selected", mediaStream.getTracks()[0]?.getSettings());
    this.setDeviceIdAndMediaStream(deviceId, mediaStream, supportsFixedFocus);
  }

  setDeviceId = async (deviceId?: string) => {
    if (deviceId == null) {
      this.clear();
      return;
    }
    const camera = this.camerasOnThisDevice.camerasByDeviceId.get(deviceId);
    if (camera != null) {
      // console.log("Setting camera with capabilities ", {...camera.capabilities}, JSON.stringify(camera.capabilities))
      await this.setCamera(camera);
    }
  }

  constructor(readonly camerasOnThisDevice: CamerasOnThisDevice, readonly defaultMediaTrackConstraints: MediaTrackConstraints) {
    makeAutoObservable(this, {
      camerasOnThisDevice: false,
      defaultMediaTrackConstraints: false
    });
  }


}
