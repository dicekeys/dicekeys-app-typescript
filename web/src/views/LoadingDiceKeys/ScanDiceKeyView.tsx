import { observer } from "mobx-react";
import React from "react";
import { FaceRead } from "@dicekeys/read-dicekey-js";
import { CameraCaptureWithOverlay, CameraCaptureWithOverlayProperties } from "./CameraCaptureWithOverlay";
import { DiceKeyFrameProcessorState } from "./DiceKeyFrameProcessorState";
import { processDiceKeyImageFrame } from "./process-dicekey-image-frame";
import { Camera, CamerasOnThisDevice } from "./CamerasOnThisDevice";
import { TupleOf25Items, DiceKeyWithKeyId } from "../../dicekeys/DiceKey";
import { MediaStreamState } from "./MediaStreamState";
import { CameraSelectionView } from "./CameraSelectionView";
import styled from "styled-components";
import { RUNNING_IN_BROWSER } from "../../utilities/is-electron";
import { TopNavigationBarHeight } from "../Navigation/NavigationLayout";
import { action } from "mobx";
// import { CamerasBeingInspected } from "./CamerasBeingInspected";

const minCameraWidth = 1024;
const minCameraHeight = 720;


const NotificationDiv = styled.div`
  min-height: ${TopNavigationBarHeight};
  flex-direction: column;
  justify-content: flex-start;
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  display: flex;
  align-items: center;
  align-content: center;
  padding-left: 2vw;
  padding-right: 2vw;
  padding-top: 0.25vh;
  padding-bottom: 0.25vh;
  background-color: yellow;
  font-size: 1.5rem
`;

const PrimaryInstruction = styled.div`
  display: flex;
  font-size: 1.5rem
`;

const SecondaryInstruction = styled.div`
  display: flex;
  font-size: 1.0em;
`;

const defaultMediaTrackConstraints: MediaTrackConstraints = {
  width: {
//          ideal: Math.min(camera.capabilities?.width?.max ?? defaultCameraDimensions.width, defaultCameraDimensions.width),
//    max: 1280,
    ideal: 1024,
//    min: minCameraWidth,
  },
  height: {
//          ideal: Math.min(camera.capabilities?.height?.max ?? defaultCameraDimensions.height, defaultCameraDimensions.height),
//    max: 1280,
//    minCameraHeight,
    ideal: 1024,
  },
  aspectRatio: {ideal: 1}
};

export interface ScanDiceKeyViewProps extends Omit<CameraCaptureWithOverlayProperties, "cameras" | "mediaStreamState"> {
  onFacesRead?: (facesRead: TupleOf25Items<FaceRead>) => any
  onDiceKeyRead?: (diceKey: DiceKeyWithKeyId) => any,
  showBoxOverlay?: boolean;
};
/* type ScanDiceKeyViewProps =  Exclude<CameraCaptureWithOverlayProperties, "cameras" | "mediaStreamState"> &  React.PropsWithoutRef<{
  onFacesRead?: (facesRead: TupleOf25Items<FaceRead>) => any
  onDiceKeyRead?: (diceKey: DiceKeyWithKeyId) => any,
  showBoxOverlay?: boolean;
  maxWidth?: string;
  maxHeight?: string;
  minHeight?: string;
  height?: string
}>; */

const PermissionRequiredView = () => (
  <NotificationDiv>
    <PrimaryInstruction>
      You need to grant &ldquo;allow always&rdquo; permission to your device's cameras to scan DiceKeys.
    </PrimaryInstruction>
    <SecondaryInstruction>
      If this message does not go away after granting permissions, refresh this page.
    </SecondaryInstruction>
  </NotificationDiv>
);


const NoCameraAvailableView = ({minCameraWidth, minCameraHeight}: {
  minCameraWidth: number,
  minCameraHeight: number
}) => {
  return (
    <NotificationDiv>
      <PrimaryInstruction>
        You do not have a sufficiently-high resolution camera available to scan your DiceKey.
      </PrimaryInstruction>
      <SecondaryInstruction>
        You need a camera with resolution at least {minCameraWidth}&times;{minCameraHeight}.
      </SecondaryInstruction>
    </NotificationDiv>
  )
}


export const ScanDiceKeyView = observer ( class ScanDiceKeyView extends React.Component<ScanDiceKeyViewProps>  {
  frameProcessorState: DiceKeyFrameProcessorState;
  mediaStreamState = new MediaStreamState(this.camerasOnThisDevice, defaultMediaTrackConstraints);
  onFrameCaptured = async (framesImageData: ImageData, canvasRenderingContext: CanvasRenderingContext2D): Promise<void> => {
    this.frameProcessorState.handleProcessedCameraFrame(await processDiceKeyImageFrame(framesImageData), canvasRenderingContext);
  }

  constructor(props: ScanDiceKeyView["props"]) {
    super(props);
    this.frameProcessorState = new DiceKeyFrameProcessorState(props);
  }

  get camerasOnThisDevice(): CamerasOnThisDevice { return  CamerasOnThisDevice.instance(minCameraWidth, minCameraHeight); }

  componentWillUnmount() {
    this.mediaStreamState.clear();
  }

  get cameras() {
    return this.camerasOnThisDevice.cameras.filter( (camera) => {
      const width = camera.capabilities?.width?.max;
      const height = camera.capabilities?.height?.max;
      return (!height || !minCameraHeight || height >= minCameraHeight) &&
      (!width || !minCameraHeight ||  width >= minCameraWidth)
    });
  }

  get defaultCamera(): Camera | undefined { return this.cameras[0] }

  static readonly msToWaitBeforeCameraPermissionWarning = 5000;
  componentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning: boolean = (() => {
    setTimeout( action ( () => {
      this.componentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning = true;
    }), ScanDiceKeyView.msToWaitBeforeCameraPermissionWarning)
    return false;
  })();


  render() {
    const camerasOnThisDevice = this.camerasOnThisDevice;
    const cameraCaptureWithOverlayProps = this.props;

    // Uncomment if we want to provide transparency into the
    // camera scanning process rather than just wait for it to complete...
    /* if (!camerasOnThisDevice.ready) {
      return (<CamerasBeingInspected {...{camerasOnThisDevice}} />)
    } */
    if (!camerasOnThisDevice.readyAndNonEmpty && RUNNING_IN_BROWSER) {
      if (this.componentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning) {
        return ( <PermissionRequiredView/> );
      }
    }
    const cameras = this.cameras;
    if (camerasOnThisDevice.ready && cameras.length === 0) {
      return ( <NoCameraAvailableView minCameraWidth={minCameraWidth} minCameraHeight={minCameraHeight} /> );
    }
    return (
      <>
        <CameraCaptureWithOverlay
          {...cameraCaptureWithOverlayProps}
          onFrameCaptured={this.onFrameCaptured}
          mediaStreamState={this.mediaStreamState}
        />
        <CameraSelectionView mediaStreamState={this.mediaStreamState} cameras={cameras} />
      </>
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
