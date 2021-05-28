import React from "react";

import { observer } from "mobx-react";
import { OverlayCanvas } from "../basics/overlay-canvas";
import { createReactObservableBounds } from "../basics/bounds";
import { Layout } from "../../css";
import { MediaStreamState } from "./MediaStreamState";
import { FrameGrabberUsingImageCapture } from "./FrameGrabberUsingImageCapture";
import { FrameGrabberFromVideoElement } from "./FrameGrabberFromVideoElement";
import { WithSettableBounds, SettableBounds } from "../../utilities/WithBounds";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");

export interface CameraCaptureWithOverlayProperties {
  mediaStreamState: MediaStreamState;
//  onVideoElementRef?: (e: HTMLVideoElement | undefined) => any;
  onFrameCaptured?: (frame: ImageData, canvasRenderingContext: CanvasRenderingContext2D) => any;
}

export const CameraCaptureWithOverlay = observer ( class CameraCaptureWithOverlay extends React.Component<React.PropsWithoutRef<CameraCaptureWithOverlayProperties>> {

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
    if (useImageCapture) {
      const {mediaStream} = this.props.mediaStreamState;
      const track = mediaStream?.getTracks()[0];
      if (track) {
        new FrameGrabberUsingImageCapture(track, this.onFrameCaptured);;
      }
    }
         
    const withVideoElementRef = (videoElement: HTMLVideoElement | null) => {
      if (videoElement == null) return;
//      autorun( () => {
        videoElement.srcObject = this.props.mediaStreamState.mediaStream ?? null;
//      });
      makeThisVideoElementsBoundsObservable(videoElement);
      if (useVideoElementCapture && videoElement.srcObject != null) {
        new FrameGrabberFromVideoElement(videoElement, this.onFrameCaptured) 
      }
    };
  
    return (
      <div className={Layout.ColumnCentered}>
        <WithSettableBounds settableBounds={this.settableBounds} aspectRatioWidthOverHeight={1} maxWidth="100vw" maxHeight="75vh">
          { bounds => (<>
            <video
              width={bounds.width}
              height={bounds.height}
              autoPlay={true}
              ref={withVideoElementRef}
            />
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
