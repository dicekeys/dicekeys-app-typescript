import React from "react";
import { observer } from "mobx-react";
import { ObservableBounds } from "./bounds";
import styled from "styled-components";

const OverlayCanvasElement = styled.canvas`
  position: absolute;
  background: rgba(0, 0, 0, 0);
  z-index: 16;
`;

export const OverlayCanvas = observer ( React.forwardRef<HTMLCanvasElement, {bounds: ObservableBounds} >(
  ( props, ref ) => {
    const {bounds, ...canvasProps} = props;
    const {width, height, left, top} = bounds.contentRect;
    return (
      <OverlayCanvasElement width={width} height={height} style={{left, top}} ref={ref} {...canvasProps} />
    );
    }
));