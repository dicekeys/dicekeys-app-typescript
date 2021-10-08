import React from "react";
import {observer} from "mobx-react";
import {
  CamerasOnThisDevice
} from "./CamerasOnThisDevice";
import styled from "styled-components";

const CameraNameDiv = styled.div`
  color: green;
  font-size: 1.25rem;
`;
// export interface CamerasBeingInspectedOptions extends React.Props{}

// FIXME, class names below are no-ops.
export const CamerasBeingInspected = observer( () => {
  const camerasOnThisDevice = CamerasOnThisDevice.instance;
  return (
    <CameraNameDiv>
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
    </CameraNameDiv>
  )
});
