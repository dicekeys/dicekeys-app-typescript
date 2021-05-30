import { observer } from "mobx-react";
import React from "react";
import { CamerasOnThisDevice } from "./CamerasOnThisDevice";
import { CenteredControls } from "../../views/basics";
import { MediaStreamState } from "./MediaStreamState";

interface CameraSelectionViewProps {
  mediaStreamState: MediaStreamState
  minCameraWidth: number,
  minCameraHeight: number
}
export const CameraSelectionView = observer ( (props: React.PropsWithoutRef<CameraSelectionViewProps>) => {
  const {minCameraWidth, minCameraHeight} = props;
  const cameras = CamerasOnThisDevice.instance.cameras.filter( (camera) => {
    const width = camera.capabilities?.width?.max;
    const height = camera.capabilities?.height?.max;
    return (!height || !minCameraHeight || height >= minCameraHeight) &&
    (!width || !minCameraHeight ||  width >= minCameraWidth)
  });
  const defaultDevice = cameras[0];
  if (defaultDevice && props.mediaStreamState.deviceId == null) {
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
