import React from "react";
import { observer } from "mobx-react";
import { ObservableBounds } from "./bounds";
import styled from "styled-components";

const OverlayCanvasElement = styled.canvas`
  position: absolute;
  background: rgba(0, 0, 0, 0);
  z-index: 16;
`;

export const OverlayCanvas = observer ( React.forwardRef<HTMLCanvasElement, {bounds: ObservableBounds, aspectRatio?: number} >(
  ( props, ref ) => {
    const {bounds, aspectRatio, ...canvasProps} = props;
    const {width, height, left, top} = bounds.contentRect;
    const adjustedWidth = aspectRatio == null ? width : Math.min(width, Math.round(height * aspectRatio));
    const adjustedHeight = (aspectRatio == null || aspectRatio === 0) ? height : Math.min(height, Math.round(width / aspectRatio));
    const adjustedTop = top + (height - adjustedHeight) / 2;
    const adjustedLeft = left + (width - adjustedWidth) / 2;
    return (
      <OverlayCanvasElement
        width={adjustedWidth}
        height={adjustedHeight}
        style={{left: adjustedLeft, top: adjustedTop}}
        ref={ref}
        {...canvasProps}
      />
    );
    }
));