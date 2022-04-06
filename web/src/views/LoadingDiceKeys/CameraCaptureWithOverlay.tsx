import React from "react";

import { observer } from "mobx-react";
import { OverlayCanvas } from "../basics/OverlayCanvas";
import { createReactObservableBounds, ObservableBounds } from "../basics/bounds";
import { MediaStreamState } from "./MediaStreamState";
import { FrameGrabberUsingImageCapture } from "./FrameGrabberUsingImageCapture";
import { FrameGrabberFromVideoElement } from "./FrameGrabberFromVideoElement";

import ScanningOverlayImage from /*url:*/"../../images/Scanning Overlay.svg";
import styled from "styled-components";

export const imageCaptureSupported: boolean = (window.hasOwnProperty("ImageCapture"));

export interface CameraCaptureWithOverlayProperties {
  mediaStreamState: MediaStreamState;
  onFrameCaptured?: (frame: ImageData, canvasRenderingContext: CanvasRenderingContext2D) => any;
  showBoxOverlay?: boolean;
  width?: string;
  minHeight?: string;
  height?: string;
  maxHeight?: string;
}


export const MiddleOverlaySquare = observer ( ({bounds}: {bounds: ObservableBounds}) => {
  const {width, height, left, top} = bounds.contentRect;
  const squareSize = Math.min(width, height);
  const adjustedTop = top + (height - squareSize) / 2;
  const adjustedLeft = left + (width - squareSize) / 2;
  return (
    <MiddleOverlayImg
      src={ScanningOverlayImage} 
      width={squareSize}
      height={squareSize}
      style={{left: adjustedLeft, top: adjustedTop}}
    />
  );
});
export const CameraCaptureVideoAndOverlayContainer = styled.div`
  display: flex;
  align-self: center;
  justify-self: center;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  align-content: center;
  flex-grow: 5;
  flex-shrink: 5;
`;
  

const MiddleOverlayImg = styled.img`
  position: absolute;
  background: rgba(0, 0, 0, 0);
  z-index: 8;
`;

export const CameraCaptureWithOverlay = observer ( class CameraCaptureWithOverlay extends React.Component<React.PropsWithChildren<CameraCaptureWithOverlayProperties>> {

  renderingContext?: CanvasRenderingContext2D;

  onFrameCaptured = async (frame: ImageData) => {
    const renderingContext = this.renderingContext;
    if (renderingContext) {
      await this.props.onFrameCaptured?.(frame, renderingContext);
    }
  }

  render() {
    const [videoElementBounds, makeThisVideoElementsBoundsObservable] = createReactObservableBounds();
    const useImageCapture = imageCaptureSupported;
    const useVideoElementCapture = !useImageCapture;
    const {mediaStreamState} = this.props;
    // Unless the parent sets showBoxOverlay, show the box overlay only when
    // we can set the focus mode to something close.  Otherwise, the overlay may
    // encourage the user to put the DiceKey closer than the camera can focus on it.
    const {showBoxOverlay = mediaStreamState.supportsFixedFocus} = this.props;
    const track = mediaStreamState.mediaStream?.getTracks()[0];
    const aspectRatio = track?.getSettings().aspectRatio ?? 1;
    if (useImageCapture) {
      if (track) {
        new FrameGrabberUsingImageCapture(track, this.onFrameCaptured);;
      }
    }
         
    const withVideoElementRef = (videoElement: HTMLVideoElement | null) => {
      if (videoElement == null) return;
      videoElement.srcObject = mediaStreamState.mediaStream ?? null;
      makeThisVideoElementsBoundsObservable(videoElement);
      if (useVideoElementCapture && videoElement.srcObject != null) {
        new FrameGrabberFromVideoElement(videoElement, this.onFrameCaptured) 
      }
    };

    const {width, height, maxHeight, minHeight} = this.props;  

    return (
        <>
          <video
            style={
              (width != null) ?
                {width, height: "auto", minHeight, maxHeight} :
              (height != null) ?
                {width: "auto", height} :
              (maxHeight != null && minHeight != null) ?
                {width: "auto", maxHeight, minHeight} :
              (maxHeight != null) ?
                {width: "auto", maxHeight} :
                {width: `100%`, height: "auto"}
              }
              autoPlay={true}
            ref={withVideoElementRef}
          />
          { !showBoxOverlay ? null : (
            <MiddleOverlaySquare bounds={videoElementBounds} />
          )}
          <OverlayCanvas
            aspectRatio={aspectRatio}
            bounds={videoElementBounds}
            ref={ e => { this.renderingContext = e?.getContext("2d") ?? undefined; }
          } />
        </>
    );
  }
});
