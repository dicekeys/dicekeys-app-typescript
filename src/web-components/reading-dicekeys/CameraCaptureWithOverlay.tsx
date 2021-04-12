import React from "react";

import { observer } from "mobx-react";
import { OverlayCanvas } from "../basics/overlay-canvas";
import { createReactObservableBounds } from "../basics/bounds";
import { MediaStreamState, CameraCaptureView } from "./CameraCaptureView";

export const imageCaptureSupported: boolean = (typeof ImageCapture === "function");



export interface CameraCaptureWithOverlayProperties {
  mediaStreamState: MediaStreamState;
  onVideoElementRef?: (e: HTMLVideoElement | undefined) => any;
  onFrameCaptured?: (frame: ImageData, canvasRenderingContext: CanvasRenderingContext2D) => any;
}

export const CameraCaptureWithOverlay = observer ( class CameraCaptureWithOverlay extends React.Component<React.PropsWithoutRef<CameraCaptureWithOverlayProperties>> {

 // private overlayCanvasElement: HTMLCanvasElement | null = null;
  private renderingContext?: CanvasRenderingContext2D;

  onFrameCaptured = async (frame: ImageData) => {
    const renderingContext = this.renderingContext;
    // const c = this.testCanvasIllustratingFramesCaptured;
    // if (c) {
    //   c.width = frame.width;
    //   c.height = frame.height;
    //   const ctx = c.getContext("2d");
    //   ctx?.putImageData(frame, 0, 0);
    // }
    if (renderingContext) {
      await this.props.onFrameCaptured?.(frame, renderingContext);
    }
  }

  // testCanvasIllustratingFramesCaptured?: HTMLCanvasElement

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
          this.renderingContext = e?.getContext("2d") ?? undefined;
        }} />
        {/* <canvas ref={c => this.testCanvasIllustratingFramesCaptured = c ?? undefined}/> */}
      </div>
    );
  }
});
