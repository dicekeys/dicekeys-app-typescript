import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Bounds, fitRectangleWithAspectRatioIntoABoundingBox } from "./bounding-rects";

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

export interface WithBoundsProps {
  weight?: number,
  fitToWidthOverHeight?: number,
  content: (bounds: Bounds) => JSX.Element
}

export const WithBounds = observer( (props: WithBoundsProps) => {
  const componentRef = React.useRef<HTMLDivElement>(null);

  const {weight, fitToWidthOverHeight, content, ...divProps} = props;
  const {bounds, setBounds} = createBounds(fitToWidthOverHeight);
  useContainerDimensions(componentRef, setBounds);
  const flexWeightAsCSS = weight == null ? {} : {flexGrow: weight, flexShrink: weight};
  return (
    <div {...divProps} style={{...flexWeightAsCSS, padding: 0, margin: 0, display: "flex",
      justifyContent: "stretch",
      alignContent: "stretch",
      flexGrow: 1,
      flexShrink: 1,
    }} ref={componentRef}>
    { content(bounds) }
    </div>
  )
});

// export interface BoundsSetterProps {
//   weight?: number,
//   fitToWidthOverHeight?: number,
//   setBounds: (bounds: Bounds) => any
// }

// export const BoundsSetter = (props: React.PropsWithChildren<BoundsSetterProps>) => {
//   const componentRef = React.useRef<HTMLDivElement>(null);

//   const {weight, fitToWidthOverHeight, setBounds, children, ...divProps} = props;
//   useContainerDimensions(componentRef, setBounds);
//   const flexWeightAsCSS = weight == null ? {} : {flexGrow: weight, flexShrink: weight};
//   return (
//     <div {...divProps}
//       style={{
//         ...flexWeightAsCSS,
//         padding: 0, margin: 0,
//         display: "flex",
//         justifyContent: "stretch",
//         alignContent: "stretch",
//         flexGrow: 1,
//         flexShrink: 1,
//     }} ref={componentRef}>
//     { children }
//     </div>
//   )
// };