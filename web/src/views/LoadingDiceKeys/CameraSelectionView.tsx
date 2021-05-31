import { observer } from "mobx-react";
import React from "react";
import { Camera } from "./CamerasOnThisDevice";
import { CenteredControls } from "../../views/basics";
import { MediaStreamState } from "./MediaStreamState";

interface CameraSelectionViewProps {
  cameras: Camera[],
  mediaStreamState: MediaStreamState
}
export const CameraSelectionView = observer ( (props: React.PropsWithoutRef<CameraSelectionViewProps>) => {
  const {cameras, mediaStreamState} = props;
  const defaultDevice = cameras[0];
  if (defaultDevice && mediaStreamState.deviceId == null) {
    props.mediaStreamState.setDeviceId(defaultDevice.deviceId);
  }
  return (
    <CenteredControls>
      <select value={props.mediaStreamState.deviceId} onChange={ (e) => props.mediaStreamState.setDeviceId(e.target.value)} >
        { cameras.map( camera => (
          <option key={camera.deviceId} value={camera.deviceId}>{ camera.name }</option>
        ))}
      </select>
    </CenteredControls>
  )
});
