import css from "./WithBounds.module.css"
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
      if (myRef.current) {
        setBounds(getBounds())
      }
    }

    handleResize();
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [myRef])

  setBounds(getBounds());
};

export class SettableBounds {

  width: number = 0;
  height: number = 0;

  get bounds() { 
    const {width, height} = this;
    return {width, height} as Bounds;
  }

  setBounds = action ( (bounds: Bounds) => {
    this.width = bounds.width;
    this.height = bounds.height;
  });
  
  constructor() {
    makeAutoObservable(this);
  }
}

export interface OptionalMaxSizeCalcProps {
  maxWidth?: string,
  maxHeight?: string,
}

export interface OptionalAspectRatioProps extends OptionalMaxSizeCalcProps {
  aspectRatioWidthOverHeight?: number,
}

type WithBoundsProps = OptionalAspectRatioProps & {
  weight?: number,
  children: (bounds: SettableBounds) => JSX.Element,
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

export const WithSettableBounds = observer( (props: WithBoundsProps & {settableBounds: SettableBounds} & React.HTMLAttributes<HTMLDivElement>) => {
  const componentRef = React.useRef<HTMLDivElement>(null);

  const {
    weight, children, style,
    aspectRatioWidthOverHeight, maxHeight, maxWidth,
    settableBounds,
    ...divProps
  } = props;
  const fit = aspectRatioWidthOverHeight ? fitRectangleWithAspectRatioIntoABoundingBox(aspectRatioWidthOverHeight) : undefined;

  const aspectRatioStyle = createAspectRatioStyle({aspectRatioWidthOverHeight, maxWidth, maxHeight})
  useContainerDimensions(componentRef, (bounds) => settableBounds.setBounds( fit ? fit(bounds) : bounds ));

  const flexWeightAsCSS = weight == null ? {} : {flexGrow: weight, flexShrink: weight};
  return (
    <div 
      className={css.WithBoundsRow}
      {...divProps}
      style={{
        ...flexWeightAsCSS,
        ...aspectRatioStyle,
        ...style,
    }} ref={componentRef}>
      <div className={css.WithBoundsColumn} >
        { children(settableBounds) }
       </div>
    </div>
  )
});

export const WithBounds = (props: WithBoundsProps & OptionalAspectRatioProps & React.HTMLAttributes<HTMLDivElement>) => (
  <WithSettableBounds {...props} settableBounds={new SettableBounds()} /> 
);