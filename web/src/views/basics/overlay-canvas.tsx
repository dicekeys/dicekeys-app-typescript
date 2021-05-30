import React from "react";
import { observer } from "mobx-react";
import { ObservableBounds } from "./bounds";
import css from "./overlay-canvas.module.css";

export const OverlayCanvas = observer ( React.forwardRef<HTMLCanvasElement, {bounds: ObservableBounds} >(
  ( props, ref ) => {
    const {bounds, ...canvasProps} = props;
    const {width, height, left, top} = bounds.contentRect;
    return (
      <canvas className={css.overlay} width={width} height={height} style={{left, top}} ref={ref} {...canvasProps} />
    );
    }
));