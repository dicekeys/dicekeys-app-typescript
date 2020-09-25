// import { browserInfo } from "~utilities/browser";
import {
  ComponentEvent
} from "../../web-component-framework"

 // Safari may require 640 or 1280, see 
 // https://stackoverflow.com/questions/46981889/how-to-resolve-ios-11-safari-getusermedia-invalid-constraint-issue
//  const defaultVideoWidthAndHeightConstraints = {
//   // width: { ideal: 1024, min: 640 },
//   // height: { ideal: 1024, min: 640 },
//   aspectRatio: {ideal: 1},
//   //    advanced: [{focusDistance: {ideal: 0}}]
// } as const;


export const videoConstraintsForDevice = (deviceId: string): MediaTrackConstraints => ({
//  ...defaultVideoWidthAndHeightConstraints,
  deviceId,
});


export type Camera = MediaDeviceInfo & MediaTrackSettings & {name: string, capabilities: MediaTrackCapabilities | undefined};

const rearDirectionNamesLc = ["environment", "rear", "back"];
const frontDirectionNamesLc = ["user", "front", "forward", "display"];
const lcStrContainsCandidate = (...lcCandidates: string[]) => (searchIn: string): boolean => {
  const lcSearchIn = searchIn.toLocaleLowerCase();
  return (lcCandidates.some( lcCandidate => lcSearchIn.indexOf(lcCandidate) !== -1))
}
const containsRearDirectionName = lcStrContainsCandidate(...rearDirectionNamesLc);
const containsFrontDirectionName = lcStrContainsCandidate(...frontDirectionNamesLc);
const containsDirectionName = lcStrContainsCandidate(...frontDirectionNamesLc, ...rearDirectionNamesLc);

const getDirectionScore = ({facingMode, label}: Camera): number => 
  ( facingMode === "environment" || containsRearDirectionName(label) ) ? -1 :
  ( facingMode === "user" || containsFrontDirectionName(label) ) ? 1 :
  0; 
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

  private static _instance: CamerasOnThisDevice | undefined;

  public static get instance(): CamerasOnThisDevice {
    if (this._instance == null) {
      this._instance = new CamerasOnThisDevice();
    }
    return this._instance;
  }

  private constructor() {
    this.addAttachedAndRemovedDetachedCameras();
    // Start getting a list of cameras
    // Make sure we update the camera list whenever a camera is added or removed
    navigator.mediaDevices.addEventListener('devicechange', () =>
      this.addAttachedAndRemovedDetachedCameras()
    );
  }

  
  /**
   * An event triggered whenever there's an update to the
   * status of building the detailed list of cameras.
   */
  public cameraListProcessingStatusUpdated = new ComponentEvent<[]>(this);

  /**
   * An event triggered whenever the list of cameras changes
   */
  public cameraListUpdated = new ComponentEvent<[Camera[]]>(this);

  public readonly camerasToBeAdded = new Map<string, MediaDeviceInfo>();
  public readonly camerasByDeviceId = new Map<string, Camera>();
  public readonly unreadableCameraDevices = new Map<string, {cameraDevice: MediaDeviceInfo, exceptions: any[]}>();

  /**
   * A list of cameras sorted by direction (back-facing first, front-facing last)
   * then sorted by label
   */
  public get cameras(): Camera[] {
    const sortedCameras = [...this.camerasByDeviceId.values()]
      .sort( (a, b) => compareCameras(a, b) );
    return sortedCameras;
  }

  private cameraDeviceIdToCameraNumber = new Map<string, number>();
  private getCameraNumber = (deviceId: string): number => {
    if (!this.cameraDeviceIdToCameraNumber.has(deviceId)) {
      this.cameraDeviceIdToCameraNumber.set(deviceId, this.cameraDeviceIdToCameraNumber.size +1);
    }
    return this.cameraDeviceIdToCameraNumber.get(deviceId)!;
  }

  /**
   * Try to access the camera to learn more about its resolution and other settings.
   * @param cameraDevice A camera's MediaDeviceInfo returned by `navigator.mediaDevices.enumerateDevices()`
   * 
   * @returns A promise to either a full Camera record or undefined
   */
  tryAddCamera = async (cameraDevice: MediaDeviceInfo): Promise<Camera | undefined> => {
    const {deviceId} = cameraDevice;
    try {
      // Get a media stream so that we can get settings from the track
      const stream = await navigator.mediaDevices.getUserMedia({video: videoConstraintsForDevice(deviceId)});
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;
      const settings: MediaTrackSettings = track.getSettings();
      const capabilities: MediaTrackCapabilities = track.getCapabilities?.() ;
      stream?.getTracks().forEach(track => track.stop() );
      // try for firefox
      stream?.stop?.();
      if (!settings) return;          
      const cameraWithoutName = {
        ...settings,
        ...{capabilities},
        ...cameraDevice,
        // The label (and possibly kind) are not copied via destructuring and must
        // be manually copied.
        kind: cameraDevice.kind,
        label: cameraDevice.label
      };
      const {label, facingMode} = cameraWithoutName;
      var {width, height} = cameraWithoutName;
      if (capabilities && capabilities.width?.max && capabilities.height?.max) {
        width = capabilities.width.max;
        height = capabilities.height.max;
      }
      // Only add a direction string if the direction is present and
      // it's not already implied in the label
      const directionPrefix = containsDirectionName(label) ? "" :
          facingMode === "user" ? "Front Facing " :
          facingMode === "environment" ? "Rear Facing " :
          "";
      const identifier: string = label || `Camera ${this.getCameraNumber(deviceId)}`;
      // Only display resolution if it's known and not the default of 640x480
      const resolution: string = (width && height && !(width===640 && height===480)) ? ` ${width}x${height} ` : ""
      const name = directionPrefix + identifier + resolution;
      // The label property needs to be set manually
      const camera: Camera = {
        ...cameraWithoutName,
        name
      };
      this.camerasToBeAdded.delete(deviceId);
      this.unreadableCameraDevices.delete(deviceId);
      this.camerasByDeviceId.set(deviceId, camera);
      this.cameraListProcessingStatusUpdated.send();
      return camera;
    } catch (e) {
      if (this.unreadableCameraDevices.has(deviceId)) {
        this.unreadableCameraDevices.get(deviceId)?.exceptions.unshift(e);
      } else {
        this.unreadableCameraDevices.set(deviceId, {cameraDevice, exceptions: [e]});
        this.cameraListProcessingStatusUpdated.send();
      }
    }
    return;
  }

  /**
   * Set to true once the list of cameras has been populated the first time
   */
  private _ready: boolean = false; 
  public get ready() { return this._ready; }
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
      ({deviceId}) => !this.camerasByDeviceId.has(deviceId) && !this.camerasToBeAdded.has(deviceId)
    );
    listOfNewlyAttachedCameras.forEach( camera => this.camerasToBeAdded.set(camera.deviceId, camera) )

    if (this.camerasToBeAdded.size > 0) {
      await Promise.all(
        // do parallel requests for user media to get camera track settings that
        // enumerateDevices doesn't offer, and can only be learned via getUserMedia 
        // followed by getSettings
        [...this.camerasToBeAdded.values()].map( camera => this.tryAddCamera(camera) )
      );
      for (const cameraDevice of this.camerasToBeAdded.values()) {
        // I hope you're as horrified as I am by the use of await in a loop.
        // This is our here by last resort since some devices will not let us
        // inspect cameras in parallel.
        // This could be bad if a device had 50 cameras attached, so um, maybe this
        // is an intentional plot to accidentally take down surveillance systems that
        // might accidentally run this code?  Yeah, that's the ticket!
        await this.tryAddCamera(cameraDevice);
      }
    }
    if (
      !this._ready ||
      deviceIdsOfRemovedCameras.length > 0 ||
      listOfNewlyAttachedCameras.length > 0
    ) {
      this._ready = true;
      // A change to the list has been made so send an update event
      this.cameraListUpdated.send(this.cameras);
    }
  }

}