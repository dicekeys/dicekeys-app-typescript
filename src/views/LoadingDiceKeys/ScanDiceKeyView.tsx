import cssRequiredNotice from "./camera-permissions-required-notification.module.css";
import { runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Face, FaceRead } from "@dicekeys/read-dicekey-js";
import { CameraCaptureWithOverlay } from "./CameraCaptureWithOverlay";
import { DiceKeyFrameProcessorState } from "./DiceKeyFrameProcessorState";
import { processDiceKeyImageFrame } from "./process-dicekey-image-frame";
import { MediaStreamState } from "./CameraCaptureView";
import { CamerasOnThisDevice } from "./CamerasOnThisDevice";
import { DiceKey, TupleOf25Items } from "../../dicekeys/DiceKey";
import { Layout } from "../../css";
import { CenteredControls } from "~views/basics";

interface CameraSelectionViewProps {
  onCameraSelected?: (camerasDeviceId: string) => any;
}
const CameraSelectionView = observer ( (props: React.PropsWithoutRef<CameraSelectionViewProps>) => {
  const cameras = CamerasOnThisDevice.instance.cameras;
  const defaultDevice = cameras[0];
  if (defaultDevice) {
    runInAction( () => {
      props.onCameraSelected?.(defaultDevice.deviceId);
    });
  }
  return (
    <CenteredControls>
      <select value={cameras[0]?.deviceId ?? ""} onChange={ (e) => props.onCameraSelected?.(e.target.value)} >
        { cameras.map( camera => (
          <option key={camera.deviceId} value={camera.deviceId}>{ camera.name }</option>
        ))}
      </select>
    </CenteredControls>
  )
});

type ScanDiceKeyViewProps = React.PropsWithoutRef<{
  onDiceKeyRead?: (facesRead: TupleOf25Items<FaceRead>) => any
}>;

const PermissionRequiredView = () => {
  return (
    <div className={cssRequiredNotice.notification}>
      <div className={cssRequiredNotice.primary_instruction}>
        You need to grant &ldquo;allow always&rdquo; permission to your device's cameras to scan DiceKeys.
      </div>
      <div className={cssRequiredNotice.secondary_instruction}>
       If this message does not go away after granting permissions, refresh this page.
      </div>
    </div>
  )
}

export const ScanDiceKeyView = observer ( class ScanDiceKeyView extends React.Component<ScanDiceKeyViewProps>  {

  frameProcessorState: DiceKeyFrameProcessorState;
  mediaStreamState = new MediaStreamState();
  onFrameCaptured = async (framesImageData: ImageData, canvasRenderingContext: CanvasRenderingContext2D): Promise<void> => {
    this.frameProcessorState.handleProcessedCameraFrame(await processDiceKeyImageFrame(framesImageData), canvasRenderingContext);
  }

  constructor(props: ScanDiceKeyView["props"]) {
    super(props);
    this.frameProcessorState = new DiceKeyFrameProcessorState(props.onDiceKeyRead);
  }

  onCameraSelected = (deviceId: string ) => {
    const mediaTrackConstraints: MediaTrackConstraints = {
      deviceId,
      width: {
//          ideal: Math.min(camera.capabilities?.width?.max ?? defaultCameraDimensions.width, defaultCameraDimensions.width),
        max: 1280,
          min: 1024,
      },
      height: {
//          ideal: Math.min(camera.capabilities?.height?.max ?? defaultCameraDimensions.height, defaultCameraDimensions.height),
        max: 1280,
          min: 1024
      },
      aspectRatio: {ideal: 1},
      // advanced: [{focusDistance: {ideal: 0}}]
    };
    this.mediaStreamState.setMediaStreamFromConstraints(mediaTrackConstraints);
  }

  componentWillUnmount() {
    this.mediaStreamState.clearMediaStream();
  }

  render() {
    if (!CamerasOnThisDevice.instance.readyAndNonEmpty) {
      return ( <PermissionRequiredView/> )
    }

    return (
      <div className={Layout.ColumnStretched}>
        <CameraCaptureWithOverlay onFrameCaptured={this.onFrameCaptured} mediaStreamState={this.mediaStreamState} />
        <CameraSelectionView onCameraSelected={this.onCameraSelected} />
      </div>
    );
  }
});

export const Preview_ScanDiceKeyView = () => (
  <ScanDiceKeyView onDiceKeyRead={ (facesRead) => {
    const diceKey: DiceKey = new DiceKey(facesRead.map( faceRead => faceRead.toFace()) as TupleOf25Items<Face>);
    const hrf = diceKey.inHumanReadableForm;
    console.log(`Read ${hrf}`);
    alert(`Read ${hrf}`);
  }} />
);
