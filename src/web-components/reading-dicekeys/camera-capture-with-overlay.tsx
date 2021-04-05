import React from "react";

import { makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import { OverlayCanvas } from "~web-components/basics/overlay-canvas";
import { createReactObservableBounds } from "~web-components/basics/bounds";
import { FrameGrabber } from "./frame-grabber";
import { MediaStreamState, CameraCapture } from "./camera-capture";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");



export interface CameraCaptureWithOverlayProperties {
  mediaStreamState?: MediaStreamState;
  onVideoElementRef?: (e: HTMLVideoElement | undefined) => any;
  onFrameCaptured?: (frame: ImageData, canvasRenderingContext: CanvasRenderingContext2D) => any;
  frameGrabber?: FrameGrabber;
}

export const CameraCaptureWithOverlay = observer ( class CameraCaptureWithOverlay extends React.Component<React.PropsWithoutRef<CameraCaptureWithOverlayProperties>> {

  constructor(props: CameraCaptureWithOverlay["props"]) {
    super(props);
    makeAutoObservable(this);
  }

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
        <CameraCapture
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
