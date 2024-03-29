import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { Bounds, fitRectangleWithAspectRatioIntoABoundingBox } from "./bounding-rects";
export type {Bounds};
import styled from "styled-components";

const WithBoundsDiv = styled.div`
  /* NOTE stretch not supported in flex-box */
  display: flex;
  justify-self: stretch;
  align-self: center;
  justify-content: space-around;
  align-content: space-around;
  flex-grow: 1;
  flex-shrink: 1;
  padding: 0;
  margin: 0;
`;

const WithBoundsRow = styled(WithBoundsDiv)`
  flex-direction: row;
`

const WithBoundsColumn = styled(WithBoundsDiv)`
  flex-direction: row;
`

// https://stackoverflow.com/questions/43817118/how-to-get-the-width-of-a-react-element
export const useContainerDimensions = (myRef: React.RefObject<{offsetWidth: number, offsetHeight: number}>, setBounds: (bounds: {width: number, height: number}) => void) => {
  const getBounds = () => ({
    width: myRef.current?.offsetWidth ?? window.innerWidth,
    height: myRef.current?.offsetHeight ?? window.innerHeight,
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
  weight?: number;
  children: (settableBounds: SettableBounds) => React.ReactNode;
};

const createAspectRatioStyle = (props: OptionalAspectRatioProps): React.CSSProperties => {
  const {aspectRatioWidthOverHeight = 1, maxWidth, maxHeight} = props ?? {};
  if (aspectRatioWidthOverHeight === 0 || maxWidth === null || maxHeight === null) {
    return {}
  } else return {
    width: `calc(min((${maxWidth}), (${maxHeight}) * (${aspectRatioWidthOverHeight})))`,
    height: `calc(min((${maxHeight}), (${maxWidth}) / (${aspectRatioWidthOverHeight})))`,
  }
}

export type WithBoundsElementProps = WithBoundsProps & Omit<React.HTMLAttributes<HTMLDivElement>, "children">;
export type WithSettableBoundsElementProps = WithBoundsElementProps & {settableBounds: SettableBounds};
export const WithSettableBounds = observer( (props: WithSettableBoundsElementProps) => {
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
    <WithBoundsRow {...divProps}
      style={{
        ...flexWeightAsCSS,
        ...aspectRatioStyle,
        ...style,
    }} ref={componentRef}>
      <WithBoundsColumn>
        { children(settableBounds) }
       </WithBoundsColumn>
    </WithBoundsRow>
  )
});

export const WithBounds = (props: WithBoundsElementProps) => (
  <WithSettableBounds {...props} settableBounds={new SettableBounds()} /> 
);