
import styles from "./camera-permissions-required-notification.module.css";
import {
  Attributes,
  Component,
  Div,
  Observable,
} from "~/web-component-framework"
import {
  CamerasOnThisDevice  
} from "./CamerasOnThisDevice"

const gracePeriodBeforeAssumingCameraLoadFailedInMs = 4000; // 4 seconds
const camerasOnThisDevice = CamerasOnThisDevice.instance;

const shouldDisplayCameraPermissionsNotice = new Observable<boolean>(false);
var camerasLoaded = new Observable<boolean>(camerasOnThisDevice.cameras.length > 0);
var gracePeriodExpired = new Observable<boolean>(false);

const updateShouldDisplayCameraPermissionsNotice = () =>
  shouldDisplayCameraPermissionsNotice.set(
    !!gracePeriodExpired.value && !camerasLoaded.value
  );

camerasLoaded.onChange( updateShouldDisplayCameraPermissionsNotice );
gracePeriodExpired.onChange( updateShouldDisplayCameraPermissionsNotice );

if (!camerasLoaded.value) {
  // Wait for the call to enumerate all cameras to complete;
  camerasOnThisDevice.cameraListUpdated.on( () => camerasLoaded.set(camerasOnThisDevice.cameras.length > 0) );
  setTimeout( () => gracePeriodExpired.set(true), gracePeriodBeforeAssumingCameraLoadFailedInMs);
}


export interface CameraPermissionsRequiredNotificationOptions extends Attributes<"div"> {}

export class CameraPermissionsRequiredNotification extends Component<CameraPermissionsRequiredNotificationOptions, "div"> {


  constructor(options: CameraPermissionsRequiredNotificationOptions = {}) {
    super(options, document.createElement("div"));
    this.addClass(styles.notification);
    shouldDisplayCameraPermissionsNotice.observe( shouldDisplay =>
      (!!shouldDisplay) ?
        this.primaryElement.style.removeProperty("display") :
        this.primaryElement.style.setProperty("display", "none")
    );
  }

  render() {
    super.render(
      Div({class: styles.primary_instruction},
        `You need "allow always" permission to your device's cameras to scan DiceKeys.`
      ),
      Div({class: styles.secondary_instruction},
        `If this message does not go away after granting permissions, refresh this page.`
      )
    );
    
  }

}