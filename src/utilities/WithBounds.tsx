import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Bounds, fitRectangleWithAspectRatioIntoABoundingBox } from "./bounding-rects";
export {Bounds};

// https://stackoverflow.com/questions/43817118/how-to-get-the-width-of-a-react-element
export const useContainerDimensions = (myRef: React.RefObject<any>, setBounds: (bounds: {width: number, height: number}) => any) => {
  const getBounds = () => ({
    width: myRef.current?.offsetWidth ?? 0,
    height: myRef.current?.offsetHeight ?? 0,
  })

  React.useEffect(() => {
    const handleResize = () => {
      setBounds(getBounds())
    }

    if (myRef.current) {
      setBounds(getBounds())
    }

    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [myRef])

  setBounds(getBounds());
};

class SettableBounds {
  width: number = 0;
  height: number = 0;
  
  constructor() {
    makeAutoObservable(this);
  }

  static create = (fitToAspectRatioAsWidthOverHeight?: number) => {
    const fitBounds = fitToAspectRatioAsWidthOverHeight == null ? undefined :
      fitRectangleWithAspectRatioIntoABoundingBox(fitToAspectRatioAsWidthOverHeight);
    const bounds = new SettableBounds();
    const setBounds = action ( (divBounds: Bounds) => {
      const {width, height} = fitBounds != null ? fitBounds(divBounds) : divBounds;
      bounds.width = width;
      bounds.height = height;
    })
    return {bounds: bounds as Bounds, setBounds}
  }
}
export const createBounds = SettableBounds.create;

export interface OptionalMaxSizeCalcProps {
  maxWidth?: string,
  maxHeight?: string,
}

export interface OptionalAspectRatioProps extends OptionalMaxSizeCalcProps {
  aspectRatioWidthOverHeight?: number,
}

type WithBoundsProps = OptionalAspectRatioProps & {
  weight?: number,
  children: (bounds: Bounds) => JSX.Element,
};

const createAspectRatioStyle = (props: OptionalAspectRatioProps): React.CSSProperties => {
  const {aspectRatioWidthOverHeight = 1, maxWidth, maxHeight} = props ?? {};
  if (aspectRatioWidthOverHeight === 0 || maxWidth === null || maxHeight === null) {
    return {}
  } else return {
    width: `min(${maxWidth}, ${maxHeight} * ${aspectRatioWidthOverHeight})`,
    height: `min(${maxHeight}, ${maxWidth} / ${aspectRatioWidthOverHeight})`,
  }
}

export const WithBounds = observer( (props: WithBoundsProps & OptionalAspectRatioProps & React.HTMLAttributes<HTMLDivElement>) => {
  const componentRef = React.useRef<HTMLDivElement>(null);

  const {
    weight, children, style,
    aspectRatioWidthOverHeight, maxHeight, maxWidth,
    ...divProps
  } = props;
  const aspectRatioStyle = createAspectRatioStyle({aspectRatioWidthOverHeight, maxWidth, maxHeight})
  const {bounds, setBounds} = createBounds(aspectRatioWidthOverHeight);
  useContainerDimensions(componentRef, setBounds);

  const edgelessFlex = {
    padding: 0, margin: 0,
    display: "flex",
    justifyContent: "space-around", // NOTE stretch not supported in flex-box
    alignContent: "stretch",
    flexGrow: 1,
    flexShrink: 1,
} as const;

  const flexWeightAsCSS = weight == null ? {} : {flexGrow: weight, flexShrink: weight};
  return (
    <div 
      className="WithBoundsRow"
      {...divProps}
      style={{
        ...flexWeightAsCSS,
        ...edgelessFlex,
        flexDirection: "row",
        ...aspectRatioStyle,
        ...style,
    }} ref={componentRef}>
      <div
        className="WithBoundsColumn"
        style={{
        ...edgelessFlex,
        flexDirection: "column",
      }}>
        { children(bounds) }
       </div>
    </div>
  )
});
