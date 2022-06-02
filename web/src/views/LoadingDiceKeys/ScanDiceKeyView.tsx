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
import { RUNNING_IN_BROWSER } from "../../utilities/is-electron";
import { action } from "mobx";
import { PushButton } from "../../css/Button";
import { CenteredControls } from "../../views/basics";
import {
  FullScreenNotification,
  FullScreenNotificationContent,
  FullScreenNotificationPrimaryText,
  FullScreenNotificationSecondaryText,
} from "../../css/FullScreenNotification";
// import { CamerasBeingInspected } from "./CamerasBeingInspected";

const minCameraWidth = 1024;
const minCameraHeight = 720;

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
  editManually?: () => void;
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

const PermissionRequiredView = ({editManually}: ScanDiceKeyViewProps) => (
  <FullScreenNotification>
    <FullScreenNotificationContent>
      <FullScreenNotificationPrimaryText>
        You need to grant &ldquo;allow always&rdquo; permission to your device's cameras to scan DiceKeys.
      </FullScreenNotificationPrimaryText>
      <FullScreenNotificationSecondaryText>
        If this message does not go away after granting permissions, refresh this page.
      </FullScreenNotificationSecondaryText>
      { editManually == null ? null : (
        <CenteredControls>
          <PushButton onClick={editManually}>enter manually instead</PushButton>
        </CenteredControls>
      )}
    </FullScreenNotificationContent>
  </FullScreenNotification>
);


const NoCameraAvailableView = ({minCameraWidth, minCameraHeight, editManually}: {
  minCameraWidth: number,
  minCameraHeight: number
} & ScanDiceKeyViewProps) => {
  return (
    <FullScreenNotification>    
      <FullScreenNotificationContent>
        <FullScreenNotificationPrimaryText>
          You do not have a sufficiently-high resolution camera available to scan your DiceKey
          or you have not provided permission to access it.
        </FullScreenNotificationPrimaryText>
        <FullScreenNotificationSecondaryText>
          You need a camera with resolution at least {minCameraWidth}&times;{minCameraHeight}.
        </FullScreenNotificationSecondaryText>
        { editManually == null ? null : (
        <CenteredControls>
          <PushButton onClick={editManually}>enter manually instead</PushButton>
        </CenteredControls>
      )}
      </FullScreenNotificationContent>
    </FullScreenNotification>
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
        return ( <PermissionRequiredView {...this.props} /> );
      }
    }
    const cameras = this.cameras;
    if (camerasOnThisDevice.ready && cameras.length === 0) {
      return ( <NoCameraAvailableView {...this.props} minCameraWidth={minCameraWidth} minCameraHeight={minCameraHeight} /> );
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
  }}
    editManually={() => alert("edit manually")}
  />
);
