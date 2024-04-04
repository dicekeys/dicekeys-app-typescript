import { Exceptions } from "@dicekeys/dicekeys-api-js";
import {makeAutoObservable, ObservableMap, runInAction} from "mobx";

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

export class TimeoutException extends Exceptions.NamedException {}

const withTimeout = (timeoutInMs: number = 5000) =>
  <T>( fn: () => Promise<T> ) => new Promise<T>( (resolve, reject ) => {

    let timeout: ReturnType<typeof setTimeout> | undefined = setTimeout( () => {
      timeout = undefined;
      reject(new TimeoutException("Timeout"));
    }, timeoutInMs);
    fn().then( result => {
      if (timeout != null) {
        clearTimeout(timeout);
        resolve(result);
      }
    }).catch( e => {
      if (timeout != null) {
        clearTimeout(timeout);
        reject(e);
      }
    });
  });
const with5SecondTimeout = withTimeout(5000);

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

  private static _instances = new Map<string, CamerasOnThisDevice>();

  public static instance(minWidth: number | undefined, minHeight: number | undefined): CamerasOnThisDevice {
    const key = `${minWidth}:${minHeight}`;
    return CamerasOnThisDevice._instances.get(key) ?? ( ()=> {
      // Create an instance
      const camerasOnThisDevice = new CamerasOnThisDevice(minWidth, minHeight);
      this._instances.set(key, camerasOnThisDevice);
      return camerasOnThisDevice;
    })()
  }

  private constructor(public readonly minWidth: number | undefined, public readonly minHeight: number | undefined) {
    makeAutoObservable(this, {
      minWidth: false,
      minHeight: false,
    });
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
//  public cameraListProcessingStatusUpdated = new ComponentEvent<[]>(this);

  /**
   * An event triggered whenever the list of cameras changes
   */
  //public cameraListUpdated = new ComponentEvent<[Camera[]]>(this);

  public readonly camerasToBeAdded = new ObservableMap<string, MediaDeviceInfo>();
  public readonly camerasByDeviceId = new ObservableMap<string, Camera>();
  public readonly unreadableCameraDevices = new ObservableMap<string, {cameraDevice: MediaDeviceInfo, exceptions: unknown[]}>();

  /**
   * A list of cameras sorted by direction (back-facing first, front-facing last)
   * then sorted by label
   */
  public get cameras(): Camera[] {
    const filteredCameras = [...this.camerasByDeviceId.values()].filter( (camera) => {
      const {minWidth, minHeight} = this;
      const width = camera.capabilities?.width?.max;
      const height = camera.capabilities?.height?.max;
      return (height == null || minHeight == null || height >= minHeight) &&
      (width == null || minWidth == null ||  width >= minWidth)
    })
    const sortedCameras = filteredCameras.sort( (a, b) => compareCameras(a, b) );
    return sortedCameras;
  }

  private cameraDeviceIdToCameraNumber = new ObservableMap<string,number>(); // new Map<string, number>();
  private getCameraNumber = (deviceId: string): number => {
    return this.cameraDeviceIdToCameraNumber.get(deviceId) ?? (() => {
      const cameraNumber = this.cameraDeviceIdToCameraNumber.size +1;
      this.cameraDeviceIdToCameraNumber.set(deviceId, cameraNumber);
      return cameraNumber;
    })()
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
      const stream = await with5SecondTimeout( () => navigator.mediaDevices.getUserMedia({video: videoConstraintsForDevice(deviceId)}) );
      if (!stream) return;
      const tracks = stream.getVideoTracks();
      if (!tracks || tracks.length === 0) {
        return;
      }
      const track = tracks[0];
      if (!track) return;
      const {settings, capabilities} = (() => {
        try {
          const settings: MediaTrackSettings = track.getSettings();
          const capabilities: MediaTrackCapabilities = track.getCapabilities?.() ;
          return {settings, capabilities};
        } finally {
          tracks.forEach( track => track.stop() );
          stream.stop?.();
        }  
      })();
      // try for firefox
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
      let {width, height} = cameraWithoutName;
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
      runInAction( () => {
        this.camerasToBeAdded.delete(deviceId);
        this.unreadableCameraDevices.delete(deviceId);
        this.camerasByDeviceId.set(deviceId, camera);
      });
//      this.cameraListProcessingStatusUpdated.send();
      return camera;
    } catch (e) {
      runInAction( () => {
        if (this.unreadableCameraDevices.has(deviceId)) {
          this.unreadableCameraDevices.get(deviceId)?.exceptions.unshift(e);
        } else {
          this.unreadableCameraDevices.set(deviceId, {cameraDevice, exceptions: [e]});
  //        this.cameraListProcessingStatusUpdated.send();
        }
      });
    }
    return;
  }

  /**
   * Set to true once the list of cameras has been populated the first time
   */
  private _ready: boolean = false; 
  public get ready() { return this._ready; }
  public get readyAndNonEmpty() { return this.ready && this.cameras.length > 0 }

  addAttachedAndRemovedDetachedCameras = async (): Promise<void> => {
    // Give the user 20 seconds to grant camera access the first time.
    const listOfAllMediaDevices = await withTimeout(20000)( () => navigator.mediaDevices.enumerateDevices() );

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

    try {
      if (this.camerasToBeAdded.size > 0) {
        await withTimeout(8000)( () => Promise.all(
          // do parallel requests for user media to get camera track settings that
          // enumerateDevices doesn't offer, and can only be learned via getUserMedia 
          // followed by getSettings
          [...this.camerasToBeAdded.values()].map( camera => this.tryAddCamera(camera) )
        ));
        const camerasWeFailedToAddDuringTheFirstTry = [...this.camerasToBeAdded.values()].filter( 
          camera => !this.camerasByDeviceId.has(camera.deviceId)
        );
        for (const camera of camerasWeFailedToAddDuringTheFirstTry) {
          // I hope you're as horrified as I am by the use of await in a loop.
          // This is our here by last resort since some devices will not let us
          // inspect cameras in parallel.
          // This could be bad if a device had 50 cameras attached, so um, maybe this
          // is an intentional plot to accidentally take down surveillance systems that
          // might accidentally run this code?  Yeah, that's the ticket!
          await with5SecondTimeout( () => this.tryAddCamera(camera) );
        }
      }
    } catch (e) {
      console.log("Exception identifying cameras on this device", e)
    }
    if (
      !this._ready ||
      deviceIdsOfRemovedCameras.length > 0 ||
      listOfNewlyAttachedCameras.length > 0
    ) {
      runInAction( () => {
        this._ready = true;
      });
    }
  }

}