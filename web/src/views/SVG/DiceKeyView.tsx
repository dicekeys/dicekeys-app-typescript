import React from "react";
import { observer } from "mobx-react";
import { EmptyPartialDiceKey, PartialDiceKey } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";
import { fitRectangleWithAspectRatioIntoABoundingBox, viewBox, Bounds } from "../../utilities/bounding-rects";
import { ToggleState } from "../../state";
import styled from "styled-components";

export interface DiceKeyRenderOptions {
  faces?: PartialDiceKey;
  highlightFaceAtIndex?: number;
  obscureAllButCenterDie?: ToggleState.ToggleState | boolean;
  diceBoxColor?: string; // [number, number, number];
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

export const DiceKeySizeModel = (linearSizeOfFace: number = 1, includeSpaceForTab: boolean = false) => {
  const tabFraction = includeSpaceForTab ? fractionOfHeightDevotedToTabIfPresent : 0;

  const linearSizeOfBox = linearSizeOfFace * ratioOfBoxWidthToFaceSize;
  const distanceBetweenDieCenters = linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  const linearSizeOfBoxWithTab = linearSizeOfBox * (1 + tabFraction);

  const width = linearSizeOfBox;
  const height = linearSizeOfBox * (1 / (1 - tabFraction));
  const bounds = {width, height};

  const top = -linearSizeOfBox / 2;
  const left = -linearSizeOfBox / 2;
  const radius = linearSizeOfBox / 50;

  return {
    linearSizeOfFace, includeSpaceForTab,
    tabFraction, linearSizeOfBox,
    distanceBetweenDieCenters, linearSizeOfBoxWithTab,
    width, height, bounds, top, left, radius
  }
}
export type DiceKeySizeModel = ReturnType<typeof DiceKeySizeModel>;

const DiceKeySizeModelFromBounds = (widthOverHeight: number, includeSpaceForTab: boolean) => (bounds: Bounds) =>
    DiceKeySizeModel(fitRectangleWithAspectRatioIntoABoundingBox(widthOverHeight)(bounds).width / ratioOfBoxWidthToFaceSize, includeSpaceForTab);
export const DiceKeySizeModelFromBoundsWithTab = DiceKeySizeModelFromBounds(1/(1-fractionOfHeightDevotedToTabIfPresent), true);
export const DiceKeySizeModelFromBoundsWithoutTab = DiceKeySizeModelFromBounds(1, false);

const sizeModelWithTab = DiceKeySizeModel(1, true);
const sizeModelWithoutTab = DiceKeySizeModel(1, false);
type DiceKeySvgGroupProps = DiceKeyRenderOptions & React.SVGAttributes<SVGGElement>

export const DiceKeySvgGroup = observer( (props: DiceKeySvgGroupProps & {sizeModel: DiceKeySizeModel}) => {
    const {
      faces,
      diceBoxColor =  "#050350",
      highlightFaceAtIndex,
      showLidTab = false,
      leaveSpaceForTab = showLidTab,
      obscureAllButCenterDie = ToggleState.ObscureDiceKey,
      sizeModel,
      // If onFaceClick is not defined and obscureAllButCenterDie is,
      // the when the face is clicked trigger the obscuring toggle
      onFaceClicked, 
      // The rest of the props are for the underlying svg <g> tag
      ...svgGroupProps
    } = props;

    const obscure: boolean = typeof obscureAllButCenterDie === "object" ?
      obscureAllButCenterDie?.value :
      !!obscureAllButCenterDie;
  
    return (
      <g {...svgGroupProps}
        onClick={typeof obscureAllButCenterDie !== "object" ? undefined : obscureAllButCenterDie.toggle}
        >
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
          (faces ?? EmptyPartialDiceKey).map( (face, index) =>
            (index != 12 && obscure) ? (
              // Obscure the DiceKey by rendering empty squares for all faces but the center face
              <rect 
                key={index}
                x={sizeModel.distanceBetweenDieCenters * (-2 + (index % 5)) -sizeModel.linearSizeOfFace/2}
                y={sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5)) -sizeModel.linearSizeOfFace/2}
                width={sizeModel.linearSizeOfFace} height={sizeModel.linearSizeOfFace}
                rx={sizeModel.linearSizeOfFace/12} ry={sizeModel.linearSizeOfFace/12}
                fill={ "rgba(96,123,202,.15)"
              }
            />
            ) : (
              // Render the face
              <FaceGroupView
                {...(onFaceClicked ? ({onFaceClicked: () => onFaceClicked(index) }) : {})}
                key={index}
                face={face}
                backgroundColor={((!("letter" in face))&&(!("digit" in face))) ? "rgba(96,123,202,1)" : undefined}
                linearSizeOfFace={sizeModel.linearSizeOfFace}
                center={{
                  x: sizeModel.distanceBetweenDieCenters * (-2 + (index % 5)),
                  y: sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5))}
                }
                highlightThisFace={highlightFaceAtIndex == index}
              />)
            )
        }
      </g>
    );
});

const DiceKeySvgElement = styled.svg`
  display: flex;
  flex-basis: 0;
  flex-grow: 1;
  flex-shrink: 5;
  align-self: center;
  justify-self: center;
`;

export const DiceKeyView = ({
  // DiceKeyRenderOptions
  faces,
  highlightFaceAtIndex,
  obscureAllButCenterDie,
  diceBoxColor,
  showLidTab,
  leaveSpaceForTab,
  onFaceClicked,
  // Prop specific to this view
  size,
  // Props to pass down to svg element.
  style,
  ...svgProps
}: {size?: string} & DiceKeyRenderOptions & React.SVGAttributes<SVGElement>) => {
  const sizeModel = (showLidTab || leaveSpaceForTab) ? sizeModelWithTab : sizeModelWithoutTab;
  return (
    <DiceKeySvgElement
      {...svgProps}
      viewBox={viewBox((sizeModel.bounds))}
      // width={size}
      // height={size}
      preserveAspectRatio="xMidYMid meet"
      style={(size != null ? {...style, width: size, height: size, minHeight: size, minWidth: size} : {...style}) }
    >
      <DiceKeySvgGroup {...{faces,sizeModel,highlightFaceAtIndex,obscureAllButCenterDie,diceBoxColor,showLidTab,leaveSpaceForTab,onFaceClicked,}} />
    </DiceKeySvgElement>
  );
};
