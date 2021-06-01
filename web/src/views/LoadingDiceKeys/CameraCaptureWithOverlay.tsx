import React from "react";

import { Layout } from "../../css";
import css from "./ScanDiceKey.module.css";
import { observer } from "mobx-react";
import { OverlayCanvas } from "../basics/overlay-canvas";
import { createReactObservableBounds } from "../basics/bounds";
import { MediaStreamState } from "./MediaStreamState";
import { FrameGrabberUsingImageCapture } from "./FrameGrabberUsingImageCapture";
import { FrameGrabberFromVideoElement } from "./FrameGrabberFromVideoElement";
import { WithSettableBounds, SettableBounds } from "../../utilities/WithBounds";

import ScanningOverlayImage from /*url:*/"../../images/Scanning Overlay.svg";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

export interface CameraCaptureWithOverlayProperties {
  mediaStreamState: MediaStreamState;
  onFrameCaptured?: (frame: ImageData, canvasRenderingContext: CanvasRenderingContext2D) => any;
  showBoxOverlay?: boolean;
  maxWidth?: string;
  maxHeight?: string;
}

export const CameraCaptureWithOverlay = observer ( class CameraCaptureWithOverlay extends React.Component<React.PropsWithChildren<CameraCaptureWithOverlayProperties>> {

 // private overlayCanvasElement: HTMLCanvasElement | null = null;
  private renderingContext?: CanvasRenderingContext2D;

  onFrameCaptured = async (frame: ImageData) => {
    const renderingContext = this.renderingContext;
    if (renderingContext) {
      await this.props.onFrameCaptured?.(frame, renderingContext);
    }
  }

  settableBounds = new SettableBounds();

  render() {
    const [videoElementBounds, makeThisVideoElementsBoundsObservable] = createReactObservableBounds();
    const useImageCapture = ImageCapture != null;
    const useVideoElementCapture = !useImageCapture;
    const {mediaStreamState} = this.props;
    // Unless the parent sets showBoxOverlay, show the box overlay only when
    // we can set the focus mode to something close.  Otherwise, the overlay may
    // encourage the user to put the DiceKey closer than the camera can focus on it.
    const {showBoxOverlay = mediaStreamState.supportsFixedFocus} = this.props;
    if (useImageCapture) {
      const {mediaStream} = mediaStreamState;
      const track = mediaStream?.getTracks()[0];
      if (track) {
        new FrameGrabberUsingImageCapture(track, this.onFrameCaptured);;
      }
    }
         
    const withVideoElementRef = (videoElement: HTMLVideoElement | null) => {
      if (videoElement == null) return;
        videoElement.srcObject = this.props.mediaStreamState.mediaStream ?? null;
      makeThisVideoElementsBoundsObservable(videoElement);
      if (useVideoElementCapture && videoElement.srcObject != null) {
        new FrameGrabberFromVideoElement(videoElement, this.onFrameCaptured) 
      }
    };

    const {maxWidth="100vw", maxHeight="75vh"} = this.props;
  
    return (
      <div className={Layout.ColumnCentered}>
        <WithSettableBounds settableBounds={this.settableBounds} aspectRatioWidthOverHeight={1} {...{maxWidth, maxHeight}}>
          { bounds => (<>
            <video
              width={bounds.width}
              height={bounds.height}
              autoPlay={true}
              ref={withVideoElementRef}
            />
            { !showBoxOverlay ? null : (
              <img className={css.MiddleOverlay}
                src={ScanningOverlayImage} 
                width={bounds.width}
                height={bounds.height}
              />
            )}
            <OverlayCanvas
              bounds={videoElementBounds}
              ref={ e => { this.renderingContext = e?.getContext("2d") ?? undefined; }
            } />
          </>)
        }</WithSettableBounds>
      </div>
    );
  }
});
