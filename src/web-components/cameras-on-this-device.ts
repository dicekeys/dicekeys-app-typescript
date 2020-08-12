import {ComponentEvent} from "../web-component-framework"


 // Safari may require 640 or 1280, see 
 // https://stackoverflow.com/questions/46981889/how-to-resolve-ios-11-safari-getusermedia-invalid-constraint-issue
 const defaultVideoWidthAndHeightContraints = {
  width: { ideal: 1024, min: 640 },
  height: { ideal: 1024, min: 640 },
  aspectRatio: {ideal: 1},
  //    advanced: [{focusDistance: {ideal: 0}}]
} as const;

// const defaultVideoDeviceConstraints: MediaStreamConstraints = {video: {
//   ...defaultVideoWidthAndHeightContraints,
//   facingMode: "environment" // "user" (faces the user) | "environment" (away from user)
// }}

export const videoConstraintsForDevice = (deviceId: string): MediaTrackConstraints => ({
  ...defaultVideoWidthAndHeightContraints,
  deviceId,
});


export type Camera = MediaDeviceInfo & MediaTrackSettings & {capabilities: MediaTrackCapabilities};

const getDirectionScore = ({facingMode}: Camera): number =>
  facingMode === "environment" ? -1 : // put cameras facing out first on the list
  typeof facingMode !== "string" ? 0 : // put cameras with an undefined direction next 
  1; // put cameras facing "user", "left", or "right" last;
const getResolutionCapabilitiesScore = ({capabilities}: Camera): number =>
  (capabilities && capabilities.width && capabilities.width.max && capabilities.height && capabilities.height.max) ?
  -capabilities.width.max * capabilities.height.max :
  0;

const compareCameras = (a: Camera, b: Camera): number => {
  const byDirectionScore = getDirectionScore(a) - getDirectionScore(b);
  if (byDirectionScore != 0) return byDirectionScore;
  const byResolutionCapabilitiesScore = getResolutionCapabilitiesScore(a) - getResolutionCapabilitiesScore(b);
  if (byResolutionCapabilitiesScore != 0) return byResolutionCapabilitiesScore;
  const byLabel = a.label?.localeCompare(b.label ?? "") ?? 0;
  return byLabel;
}

export class CamerasOnThisDevice {

  constructor() {
    this.addAttachedAndRemovedDetachedCameras();
    // Start getting a list of cameras
    // Make sure we update the camera list whenever a camera is added or removed
    navigator.mediaDevices.addEventListener('devicechange', () =>
      this.addAttachedAndRemovedDetachedCameras()
    );

  }
  /**
   * An event triggered whenever the list of cameras changes
   */
  updated = new ComponentEvent<[Camera[]]>(this);

  private camerasByDeviceId = new Map<string, Camera>();
  private unreadableCameraDevices = new Map<string, {cameraDevice: MediaDeviceInfo, exceptions: any[]}>();

  /**
   * A list of cameras sorted by direction (back-facing first, front-facing last)
   * then sorted by label
   */
  get cameras(): Camera[] {
    const sortedCameras = [...this.camerasByDeviceId.values()]
      .sort( (a, b) => compareCameras(a, b) );
    return sortedCameras;
  }

  tryAddCamera = async (cameraDevice: MediaDeviceInfo): Promise<Camera | undefined> => {
    const {deviceId} = cameraDevice;
    try {
      // Get a media stream so that we can get settings from the track
      const stream = await navigator.mediaDevices.getUserMedia({video: videoConstraintsForDevice(deviceId)});
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const settings: MediaTrackSettings = track.getSettings();
      const capabilities: MediaTrackCapabilities = track.getCapabilities();
      stream?.getTracks().forEach(track => track.stop() );
      if (!settings) return;          
      // The label property needs to be set manually
      const camera: Camera = {
        ...settings,
        ...{capabilities},
        ...cameraDevice,
        // The label (and possibly kind) are not copied via destructuring and must
        // be manually copied.
        kind: cameraDevice.kind,
        label: cameraDevice.label
      };
      this.camerasByDeviceId.set(deviceId, camera);
      // Just in case we had a problem loading this device in the past,
      // remove it from the list of unreadable cameras
      this.unreadableCameraDevices.delete(deviceId);
      return camera;
    } catch (e) {
      if (this.unreadableCameraDevices.has(deviceId)) {
        this.unreadableCameraDevices.get(deviceId)?.exceptions.unshift(e);
      } else {
        this.unreadableCameraDevices.set(deviceId, {cameraDevice, exceptions: [e]})
      }
    }
    return;
  }

  addAttachedAndRemovedDetachedCameras = async (): Promise<void> => {
    const listOfAllMediaDevices = await navigator.mediaDevices.enumerateDevices();

    const listOfCurrentCameras = listOfAllMediaDevices
      .filter( ({kind}) => kind.toLocaleLowerCase().startsWith('video') );
    const setOfCurrentCamerasDeviceIds = listOfCurrentCameras.reduce( (setOfIds, camera) => {
      setOfIds.add(camera.deviceId)
      return setOfIds;
    }, new Set<string>());

    // Remove cameras no longer on list of media devices (presumably disconnected);
    const deviceIdsOfRemovedCameras = [...this.camerasByDeviceId.keys()]
      .filter( deviceId => !setOfCurrentCamerasDeviceIds.has(deviceId) );
    for (const deviceIdOfRemovedCamera of deviceIdsOfRemovedCameras) {
      this.camerasByDeviceId.delete(deviceIdOfRemovedCamera);
    }

    // Add cameras added since this list was last created
    const listOfNewlyAttachedCameras = listOfCurrentCameras.filter(
      ({deviceId}) => !this.camerasByDeviceId.has(deviceId)
    );
    const setOfNewlyAttachedCameraIds = new Set<string>(listOfCurrentCameras.map( c => c.deviceId ));
    
    if (listOfNewlyAttachedCameras.length > 0) {
      await Promise.all(
        // do parallel requests for user media to get camera track settings that
        // enumerateDevices doesn't offer, and can only be learned via getUserMedia 
        // followed by getSettings
        listOfNewlyAttachedCameras.map( camera => this.tryAddCamera(camera) )
      );
      for (const [, {cameraDevice}] of this.unreadableCameraDevices) {
        if (setOfNewlyAttachedCameraIds.has(cameraDevice.deviceId)) {
          // I hope you're as horrified as I am by the use of await in a loop.
          // This is our here by last resort since some devices will not let us
          // inspect cameras in parallel.
          // This could be bad if a device had 50 cameras attached, so um, maybe this
          // is an intentional plot to accidentally take down surveillance systems that
          // might accidentally run this code?  Yeah, that's the ticket!
          await this.tryAddCamera(cameraDevice);
        }
      }
    }
    if (deviceIdsOfRemovedCameras.length > 0 || listOfNewlyAttachedCameras.length > 0) {
      // A change to the list has been made so send an update event
      this.updated.send(this.cameras);
    }
  }

}