import css from "./dicekey-view.module.css"
import React from "react";
import { observer } from "mobx-react";
import { PartialDiceKey } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";
import { Bounds, fitRectangleWithAspectRatioIntoABoundingBox, viewBox } from "../../utilities/bounding-rects";
import { WithBounds, OptionalAspectRatioProps } from "../../utilities/WithBounds";

const diceBoxColor = "#050350"; // must be in hex format as it is parsed as such in this code.

export interface DiceKeyRenderOptions {
  highlightFaceAtIndex?: number;
  diceBoxColor?: [number, number, number];
  showLidTab?: boolean;
  leaveSpaceForTab?: boolean;
  onFaceClicked?: (faceIndex: number) => any;
}

export const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 0.2;
export const marginOfBoxEdgeAsFractionOfLinearSizeOfFace = 1/8;
export const ratioOfBoxWidthToFaceSize = 1 * (
    5 +
    4 * distanceBetweenFacesAsFractionOfLinearSizeOfFace +
    2 * marginOfBoxEdgeAsFractionOfLinearSizeOfFace
  );
export const fractionBoxWithLidTabToBoxWithoutLidTab = 1.1;

const fractionOfHeightDevotedToTabIfPresent = 0.1;

export class DiceKeySizeModel {
  constructor(public readonly linearSizeOfFace: number = 1, public readonly includeSpaceForTab: boolean = false) {}

  static fromBounds = (widthOverHeight: number, includeSpaceForTab: boolean) => (bounds: Bounds) =>
    new DiceKeySizeModel(fitRectangleWithAspectRatioIntoABoundingBox(widthOverHeight)(bounds).width / ratioOfBoxWidthToFaceSize, includeSpaceForTab);
    static fromBoundsWithTab = DiceKeySizeModel.fromBounds(1/(1-fractionOfHeightDevotedToTabIfPresent), true);
    static fromBoundsWithoutTab = DiceKeySizeModel.fromBounds(1, false);

  tabFraction = this.includeSpaceForTab ? fractionOfHeightDevotedToTabIfPresent : 0;

  linearSizeOfBox = this.linearSizeOfFace * ratioOfBoxWidthToFaceSize;
  distanceBetweenDieCenters = this.linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  linearSizeOfBoxWithTab = this.linearSizeOfBox * (1 + this.tabFraction);

  width = this.linearSizeOfBox;
  height = this.linearSizeOfBox * (1 / (1 - this.tabFraction));
  get bounds() { const {width, height} = this; return {width, height}; }


  top = -this.linearSizeOfBox / 2;
  left = -this.linearSizeOfBox / 2;
  radius = this.linearSizeOfBox / 50;
}

type DiceKeySvgGroupProps = {
  faces: PartialDiceKey,
} & Bounds & DiceKeyRenderOptions & React.SVGAttributes<SVGGElement>


export const DiceKeySvgGroup = observer( (props: DiceKeySvgGroupProps) => {
    const {
      faces,
      highlightFaceAtIndex,
      showLidTab = false,
      leaveSpaceForTab = showLidTab,
      width: boundsWidth,
      height: boundsHeight,
      onFaceClicked,
      ...svgGroupProps
    } = props;

    const sizeModel = (showLidTab || leaveSpaceForTab) ?
      DiceKeySizeModel.fromBoundsWithTab(props) :
      DiceKeySizeModel.fromBoundsWithoutTab(props);
  
    return (
      <g {...svgGroupProps}>
        { (!showLidTab) ? null : (
          // Lid tab as circle
          <circle
            cx={0} cy={sizeModel.top + sizeModel.linearSizeOfBox}
            r={sizeModel.tabFraction * sizeModel.linearSizeOfBox}
            fill={diceBoxColor}
          />
        )}
        // The blue dice box
        <rect
          x={sizeModel.left} y={sizeModel.top}
          width={sizeModel.linearSizeOfBox} height={sizeModel.linearSizeOfBox}
          rx={sizeModel.radius} ry={sizeModel.radius}
          fill={diceBoxColor}
        />
        {
          faces.map( (face, index) => (
            <FaceGroupView
              {...(onFaceClicked ? ({onFaceClicked: () => onFaceClicked(index) }) : {})}
              key={index}
              face={face}
              linearSizeOfFace={sizeModel.linearSizeOfFace}
              center={{
                x: sizeModel.distanceBetweenDieCenters * (-2 + (index % 5)),
                y: sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5))}
              }
              highlightThisFace={highlightFaceAtIndex == index}
            />
          ))
        }
      </g>
    );
});

export const DiceKeyViewFixedSize = observer( (props: {faces: PartialDiceKey} & Bounds & DiceKeyRenderOptions) => (
  <svg className={css.dicekey_svg} viewBox={viewBox(props)}>
    <DiceKeySvgGroup {...props} />
  </svg>
));

export const DiceKeyViewAutoSized = observer( (
  {faces, aspectRatioWidthOverHeight, maxWidth, maxHeight, ...props}:
    {faces: PartialDiceKey} & OptionalAspectRatioProps & DiceKeyRenderOptions & {style?: React.CSSProperties}
) => (
      <WithBounds {...{...props, aspectRatioWidthOverHeight, maxWidth, maxHeight}}>{(bounds) => (
        <svg viewBox={viewBox(bounds)}>
          <DiceKeySvgGroup {...{...props, faces, ...bounds, height: bounds.height}} />
        </svg>
      )}</WithBounds> 
    )    
);
