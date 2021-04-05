import React from "react";
import {observer} from "mobx-react";
import {
  CamerasOnThisDevice
} from "./cameras-on-this-device";
import css from "./cameras-being-inspected.module.css";

// export interface CamerasBeingInspectedOptions extends React.Props{}

export const CamerasBeingInspected = observer( () => {
  const camerasOnThisDevice = CamerasOnThisDevice.instance;
  return (
    <div className={css.camera_name}>
      <div key="heading" className={""} >Identifying device cameras...</div>
      { camerasOnThisDevice.cameras.map( (camera) => (
          <div key={camera.deviceId} className={"camera-on-this-device, camera-found"} >{camera.name}</div>
        ))
      }
      { [...camerasOnThisDevice.unreadableCameraDevices.values()].map( ({cameraDevice}) => (
          <div key={cameraDevice.deviceId} className={"camera-on-this-device, camera-unreadable"} >{cameraDevice.label ?? cameraDevice.deviceId}</div>
        ))
      }
      { [...camerasOnThisDevice.camerasToBeAdded.values()].map( (camera) => (
          <div key={camera.deviceId} className={"camera-on-this-device, camera-to-be-added"} >{camera.label ?? camera.deviceId}</div>
        ))
      }
    </div>
  )
});
