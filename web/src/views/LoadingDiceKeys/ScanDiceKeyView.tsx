import cssRequiredNotice from "./camera-permissions-required-notification.module.css";
import { observer } from "mobx-react";
import React from "react";
import { FaceRead } from "@dicekeys/read-dicekey-js";
import { CameraCaptureWithOverlay } from "./CameraCaptureWithOverlay";
import { DiceKeyFrameProcessorState } from "./DiceKeyFrameProcessorState";
import { processDiceKeyImageFrame } from "./process-dicekey-image-frame";
import { CamerasOnThisDevice } from "./CamerasOnThisDevice";
import { DiceKey, TupleOf25Items } from "../../dicekeys/DiceKey";
import { Layout } from "../../css";
import { MediaStreamState } from "./MediaStreamState";
import { CameraSelectionView } from "./CameraSelectionView";

const minCameraWidth = 1024;
const minCameraHeight = 720;
const defaultMediaTrackConstraints: MediaTrackConstraints = {
  width: {
//          ideal: Math.min(camera.capabilities?.width?.max ?? defaultCameraDimensions.width, defaultCameraDimensions.width),
    max: 1280,
    ideal: 1024,
    min: minCameraWidth,
  },
  height: {
//          ideal: Math.min(camera.capabilities?.height?.max ?? defaultCameraDimensions.height, defaultCameraDimensions.height),
    max: 1280,
    min: minCameraHeight,
    ideal: 1024,
  },
  aspectRatio: {ideal: 1},
  // advanced: [{focusDistance: {ideal: 0}}]
};

type ScanDiceKeyViewProps = React.PropsWithoutRef<{
  onFacesRead?: (facesRead: TupleOf25Items<FaceRead>) => any
  onDiceKeyRead?: (diceKey: DiceKey) => any,
  showBoxOverlay?: boolean;
  maxWidth?: string;
  maxHeight?: string;
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


const NoCameraAvailableView = ({minCameraWidth, minCameraHeight}: {
  minCameraWidth: number,
  minCameraHeight: number
}) => {
  return (
    <div className={cssRequiredNotice.notification}>
      <div className={cssRequiredNotice.primary_instruction}>
        You do not have a sufficiently-high resolution camera available to scan your DiceKey.
      </div>
      <div className={cssRequiredNotice.secondary_instruction}>
        You need a camera with resolution at least {minCameraWidth}&times;{minCameraHeight}.
      </div>
    </div>
  )
}


export const ScanDiceKeyView = observer ( class ScanDiceKeyView extends React.Component<ScanDiceKeyViewProps>  {
  frameProcessorState: DiceKeyFrameProcessorState;
  mediaStreamState = new MediaStreamState(defaultMediaTrackConstraints);
  onFrameCaptured = async (framesImageData: ImageData, canvasRenderingContext: CanvasRenderingContext2D): Promise<void> => {
    this.frameProcessorState.handleProcessedCameraFrame(await processDiceKeyImageFrame(framesImageData), canvasRenderingContext);
  }

  constructor(props: ScanDiceKeyView["props"]) {
    super(props);
    this.frameProcessorState = new DiceKeyFrameProcessorState(props);
  }

  componentWillUnmount() {
    this.mediaStreamState.clear();
  }

  render() {
    const {maxWidth, maxHeight, showBoxOverlay} = this.props
    if (!CamerasOnThisDevice.instance.readyAndNonEmpty) {
      return ( <PermissionRequiredView/> );
    }
    const cameras = CamerasOnThisDevice.instance.cameras.filter( (camera) => {
      const width = camera.capabilities?.width?.max;
      const height = camera.capabilities?.height?.max;
      return (!height || !minCameraHeight || height >= minCameraHeight) &&
      (!width || !minCameraHeight ||  width >= minCameraWidth)
    });
    if (CamerasOnThisDevice.instance.ready && cameras.length === 0) {
      return ( <NoCameraAvailableView minCameraWidth={minCameraWidth} minCameraHeight={minCameraHeight} /> )
    }

    return (
      <div className={Layout.ColumnStretched}>
        <CameraCaptureWithOverlay onFrameCaptured={this.onFrameCaptured} mediaStreamState={this.mediaStreamState} {...{maxWidth, maxHeight, showBoxOverlay}} >
        </CameraCaptureWithOverlay>
        <CameraSelectionView mediaStreamState={this.mediaStreamState} cameras={cameras} />
      </div>
    );
  }
});

export const Preview_ScanDiceKeyView = () => (
  <ScanDiceKeyView onDiceKeyRead={ (diceKeyRead) => {
    const hrf = diceKeyRead.inHumanReadableForm;
    console.log(`Read ${hrf}`);
    alert(`Read ${hrf}`);
  }} />
);
