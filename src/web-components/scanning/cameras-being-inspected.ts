import {
  Attributes, Component, Div
} from "../../web-component-framework"
import {
  CamerasOnThisDevice
} from "./cameras-on-this-device";
import styles from "./cameras-being-inspected.module.css";

export interface CamerasBeingInspectedOptions extends Attributes {}
export class CamerasBeingInspected extends Component<CamerasBeingInspectedOptions> {


  constructor(options: CamerasBeingInspectedOptions) {
    super(options, document.createElement("div"));
    this.addClass(styles.camera_name)

    // Re-render when the list gets updated.
    CamerasOnThisDevice.instance.cameraListProcessingStatusUpdated.on( () => this.renderSoon() );
  }

  render() {
    const camerasOnThisDevice = CamerasOnThisDevice.instance;

    super.render();
    this.append(
      Div({class: "cameras-on-this-device-heading",
           text: "Identifying device cameras..."
          })
    )
    for (const camera of camerasOnThisDevice.cameras) {
      const {name} = camera;
      this.append(
        Div({class: ["camera-on-this-device", "camera-found"], text: name})
      )
    };
    for (const camera of camerasOnThisDevice.unreadableCameraDevices.values()) {
      const {label, deviceId} = camera.cameraDevice;
      this.append(
        Div({class: ["camera-on-this-device", "camera-unreadable"], text: label || deviceId})
      );
    }
    const camerasToBeRead = [...camerasOnThisDevice.camerasToBeAdded.values()]
      .filter( ({deviceId}) => !camerasOnThisDevice.unreadableCameraDevices.has(deviceId) )
    for (const camera of  camerasToBeRead) {
      const {label, deviceId} = camera;
      this.append(
        Div({class: ["camera-on-this-device", "camera-to-be-added"], text: label || deviceId})
      );
    }
  }

}