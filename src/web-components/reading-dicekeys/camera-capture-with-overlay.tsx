import React from "react";

import { observer } from "mobx-react";
import { OverlayCanvas } from "../../web-components/basics/overlay-canvas";
import { createReactObservableBounds } from "../../web-components/basics/bounds";
import { MediaStreamState, CameraCaptureView } from "./camera-capture-view";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");



export interface CameraCaptureWithOverlayProperties {
  mediaStreamState: MediaStreamState;
  onVideoElementRef?: (e: HTMLVideoElement | undefined) => any;
  onFrameCaptured?: (frame: ImageData, canvasRenderingContext: CanvasRenderingContext2D) => any;
}

export const CameraCaptureWithOverlay = observer ( class CameraCaptureWithOverlay extends React.Component<React.PropsWithoutRef<CameraCaptureWithOverlayProperties>> {

 // private overlayCanvasElement: HTMLCanvasElement | null = null;
  private renderingContext?: CanvasRenderingContext2D;

  onFrameCaptured = (frame: ImageData) => {
    const renderingContext = this.renderingContext;
    if (renderingContext) {
      this.props.onFrameCaptured?.(frame, renderingContext);
    }
  }

  render() {
    const [videoElementBounds, makeThisVideoElementsBoundsObservable] = createReactObservableBounds();

    return (
      <div>
        <CameraCaptureView
          onFrameCaptured={this.onFrameCaptured}
          mediaStreamState={this.props.mediaStreamState}
          makeThisElementsBoundsObservable={makeThisVideoElementsBoundsObservable}
        />
        <OverlayCanvas bounds={videoElementBounds} ref={ e => {
          // this.overlayCanvasElement = e
          this.renderingContext = e?.getContext("2d") ?? undefined;
        }} />
      </div>
    );
  }
});
