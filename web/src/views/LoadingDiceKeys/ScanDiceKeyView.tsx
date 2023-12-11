import { observer } from "mobx-react";
import React, { useEffect, useState } from "react";
import { CameraCaptureWithOverlay } from "./CameraCaptureWithOverlay";
import { DiceKeyFrameProcessorState } from "./DiceKeyFrameProcessorState";
import { processDiceKeyImageFrame } from "./process-dicekey-image-frame";
import { CamerasOnThisDevice } from "./CamerasOnThisDevice";
import { MediaStreamState } from "./MediaStreamState";
import { CameraSelectionView } from "./CameraSelectionView";
import { RUNNING_IN_BROWSER } from "../../utilities/is-electron";
import { PushButton } from "../../css/Button";
import { CenteredControls } from "../../views/basics";
import {
  FullScreenNotification,
  FullScreenNotificationContent,
  FullScreenNotificationPrimaryText,
  FullScreenNotificationSecondaryText,
} from "../../css/FullScreenNotification";
import { DiceKeyAnimationRotationProps } from "../../views/SVG/DiceKeyView";
import type { DiceKeyWithoutKeyId } from "../../dicekeys/DiceKey";

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

export interface OnDiceKeyRead {
  onDiceKeyRead: (diceKey?: DiceKeyWithoutKeyId) => void
}

//export interface ScanDiceKeyViewProps extends Omit<CameraCaptureWithOverlayProperties, "cameras" | "mediaStreamState">, DiceKeyAnimationRotationProps {
export interface ScanDiceKeyViewProps extends OnDiceKeyRead, DiceKeyAnimationRotationProps {
  height: string;
  showBoxOverlay?: boolean;
  editManually?: () => void;
}

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

const CaptureView = ({camerasOnThisDevice, ...scanDiceKeyViewProps}: ScanDiceKeyViewProps & {
  camerasOnThisDevice: CamerasOnThisDevice;
}) => {
  const [frameProcessorState] = useState(new DiceKeyFrameProcessorState(scanDiceKeyViewProps));
  const [mediaStreamState] = useState(new MediaStreamState(camerasOnThisDevice, defaultMediaTrackConstraints));
  const onFrameCaptured = async (framesImageData: ImageData, canvasRenderingContext: CanvasRenderingContext2D) =>
    processDiceKeyImageFrame(framesImageData).then( processFrameResponse => 
      frameProcessorState.handleProcessedCameraFrame(processFrameResponse, canvasRenderingContext)
    );
  // Clear the media stream state when unloading this view
  const viewComponentDestructor = () => {mediaStreamState.clear();}
  // To ensure the destructor is called when unloading this view component,
  // return the destructor from a useEffect function
  useEffect( () => { return viewComponentDestructor });

  return (
    <>
    <CameraCaptureWithOverlay
      {...{...scanDiceKeyViewProps, onFrameCaptured, mediaStreamState}}
    />
    <CameraSelectionView mediaStreamState={mediaStreamState} cameras={camerasOnThisDevice.cameras} />
  </>
  );
}


export const ScanDiceKeyView = observer ( (props: ScanDiceKeyViewProps) => {
  const camerasOnThisDevice = CamerasOnThisDevice.instance(minCameraWidth, minCameraHeight);

//  const [rotationState, setRotationState] = useState<RotationState|undefined>(undefined);
  const onDiceKeyRead = (diceKey?: DiceKeyWithoutKeyId) => {
    props.onDiceKeyRead(diceKey);
  }
  const [
    componentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning,
    setComponentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning
  ] = useState(false);
  setTimeout( () => {
    if (RUNNING_IN_BROWSER && !camerasOnThisDevice.readyAndNonEmpty) {
      setComponentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning(true)
    }}, 5000 );


  // Uncomment if we want to provide transparency into the
  // camera scanning process rather than just wait for it to complete...
  if (componentHasBeenLoadedForLongEnoughToShowCameraPermissionRequiredWarning) {
    return ( <PermissionRequiredView {...props} /> );
  }
  if (camerasOnThisDevice.ready && camerasOnThisDevice.cameras.length === 0) {
    return ( <NoCameraAvailableView {...props} minCameraWidth={minCameraWidth} minCameraHeight={minCameraHeight} /> );
  }

  return (
      <CaptureView
        {...{...props, camerasOnThisDevice, onDiceKeyRead}}
      />
  );
});

export const Preview_ScanDiceKeyView = () => (
  <ScanDiceKeyView onDiceKeyRead={ (diceKey) => {
    const hrf = diceKey?.inHumanReadableForm;
    console.log(`Read ${hrf}`);
    alert(`Read ${hrf}`);
  }}
    height={`60vh`}
    editManually={() => alert("edit manually")}
  />
);
