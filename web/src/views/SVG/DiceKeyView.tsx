import { observer } from "mobx-react";
import React from "react";
import styled, { css, keyframes } from "styled-components";
import type { DiceKey, FaceOrientationLetterTrbl } from "../../dicekeys/DiceKey";
import { EmptyPartialDiceKey, PartialDiceKey } from "../../dicekeys/DiceKey";
import { DiceKeyMemoryStore } from "../../state";
import { cssCalcTyped } from "../../utilities";
import { viewBox } from "../../utilities/bounding-rects";
import { FaceGroupView } from "./FaceView";
import { BooleanWithToggle, HideRevealSecretsState } from "../../state/stores/HideRevealSecretsState";

export interface DiceKeyRenderOptions {
  faces?: PartialDiceKey;
  highlightFaceAtIndex?: number;
  obscureAllButCenterDie?: BooleanWithToggle | boolean;
  diceBoxColor?: string; // [number, number, number];
  showLidTab?: boolean;
  leaveSpaceForTab?: boolean;
  onFaceClicked?: (faceIndex: number) => void;
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

  const top = -linearSizeOfBox / 2 - (linearSizeOfBox * tabFraction) / 2;
  const vCenter = top + (linearSizeOfBox/2);
  const left = -linearSizeOfBox / 2;
  const radius = linearSizeOfBox / 50;

  return {
    linearSizeOfFace, includeSpaceForTab,
    tabFraction, linearSizeOfBox,
    distanceBetweenDieCenters, linearSizeOfBoxWithTab,
    width, height, bounds, top, vCenter, left, radius,
  }
}
export type DiceKeySizeModel = ReturnType<typeof DiceKeySizeModel>;
export const DiceKeySizeModelForFaceAsUnit = DiceKeySizeModel(1); 
const sizeModelWithTab = DiceKeySizeModel(1, true);
const sizeModelWithoutTab = DiceKeySizeModel(1, false);
type DiceKeySvgGroupProps = DiceKeyRenderOptions & React.SVGAttributes<SVGGElement>

export const DiceKeySvgGroup = observer( (props: DiceKeySvgGroupProps & {sizeModel: DiceKeySizeModel}) => {
    const {
      faces,
      diceBoxColor =  "#050350",
      highlightFaceAtIndex,
      showLidTab = false,
      // Next line needed to remove the leaveSpaceForTab from props
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      leaveSpaceForTab: _,
      obscureAllButCenterDie = (faces?.[12] == null || faces[12].letter == null || faces[12].digit == null) ? false :
        HideRevealSecretsState.hideRevealDiceKeyBooleanWithToggle(`${faces[12].letter}${faces[12].digit}`, false),
      sizeModel,
      // If onFaceClick is not defined and obscureAllButCenterDie is,
      // the when the face is clicked trigger the obscuring toggle
      onFaceClicked, 
      // The rest of the props are for the underlying svg <g> tag
      ...svgGroupProps
    } = props;

    const obscure: boolean = typeof obscureAllButCenterDie === "object" ?
      obscureAllButCenterDie.getValue() :
      !!obscureAllButCenterDie;
    const showPressToReveal = (typeof obscureAllButCenterDie === "object") && obscure;
  
    return (
      <g {...svgGroupProps}
        onClick={() => typeof obscureAllButCenterDie !== "object" ? undefined : obscureAllButCenterDie.toggle()}
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
                y={sizeModel.vCenter + sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5)) -sizeModel.linearSizeOfFace/2}
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
                  y: sizeModel.vCenter + sizeModel.distanceBetweenDieCenters * (-2 + Math.floor(index / 5))}
                }
                highlightThisFace={highlightFaceAtIndex == index}
              />)
            )
        }{!showPressToReveal ? null : (
          // Render a "Press to Reveal" instruction over the obscured region of the DiceKey        
          <text
            x={sizeModel.left + 0.5 * sizeModel.width}
            y={sizeModel.top + 0.8 * sizeModel.height}
            width={sizeModel.width}
            fontFamily="sans-serif;"
            fill={"#808080"}
            style={{userSelect: "none"}}
            fontSize={sizeModel.height * 0.1}
            textAnchor={'middle'}
            fillOpacity={1}
          ><tspan>press to reveal</tspan
          ></text>
        )}
      </g>
    );
});

const rotateFromCenterFaceLeft = keyframes`
  from {
    transform: rotate(-90deg);
  }
  to {
    transform: rotate(0);
  }
`;
const rotateFromCenterFaceRight = keyframes`
  from {
    transform: rotate(90deg);
  }
  to {
    transform: rotate(0);
  }
`;
const rotateFromCenterFaceBottom = keyframes`
  from {
    transform: rotate(180deg);
  }
  to {
    transform: rotate(0);
  }
`;

export type CenterFaceOrientationToRotateFromRbl = Exclude<FaceOrientationLetterTrbl, "t">;

export interface DiceKeyAnimationRotationProps {
  $rotationTimeInSeconds?: number;
  $rotationDelayTimeInSeconds?: number;
  $centerFaceOrientationToRotateFrom?: CenterFaceOrientationToRotateFromRbl;
}

const DiceKeyContainerToClipRotations = styled.div<{$size?: string}>`
  overflow: clip;
  ${ ({$size: size}) => size == null ? `` : css`
    width: ${cssCalcTyped(size)};
    height: ${cssCalcTyped(size)};
  `}
`;

const DiceKeySvgElement = styled.svg<DiceKeyAnimationRotationProps & {$size?: string}>`
  display: flex;
  align-self: center;
  justify-self: center;
  overflow: hidden;
  cursor: grab;
  ${ ({$size: size}) => size == null ? `` : css`
    width: ${cssCalcTyped(size)};
    height: ${cssCalcTyped(size)};
  `}
${ ({$centerFaceOrientationToRotateFrom: centerFaceOrientationToRotateFrom, $rotationDelayTimeInSeconds: rotationDelayTimeInSeconds=0, $rotationTimeInSeconds: rotationTimeInSeconds=2.25}) =>
  centerFaceOrientationToRotateFrom == null ? `` : css`
    cursor: none;
    animation-name: ${
      centerFaceOrientationToRotateFrom === "l" ? rotateFromCenterFaceLeft :
      centerFaceOrientationToRotateFrom === "b" ? rotateFromCenterFaceBottom :
      rotateFromCenterFaceRight
    };
    animation-delay: ${ rotationDelayTimeInSeconds }s;
    animation-duration: ${ rotationTimeInSeconds }s;
    animation-timing-function: ease;
    animation-iteration-count: 1;
    animation-fill-mode: both;
    animation-direction: forward;
  `}
`


export const DiceKeyView = observer ( ({
  // DiceKeyRenderOptions
  diceKey,
  faces = diceKey?.faces,
  neverRotate = false,
  highlightFaceAtIndex,
  obscureAllButCenterDie,
  diceBoxColor,
  showLidTab,
  leaveSpaceForTab,
  onFaceClicked,
  // Props to pass down to svg element.
  ...svgProps
}: {$size?: string, diceKey?: DiceKey; neverRotate?: boolean} & DiceKeyRenderOptions & DiceKeyAnimationRotationProps & React.SVGAttributes<SVGElement>) => {
  const sizeModel = (showLidTab || leaveSpaceForTab) ? sizeModelWithTab : sizeModelWithoutTab;
  const rotationParameters = (diceKey == null || !("keyId" in diceKey) || typeof diceKey.keyId !== "string" || neverRotate) ?  undefined :
    DiceKeyMemoryStore.getRotationParametersForCenterLetterAndDigit(diceKey.centerLetterAndDigit);
  if (rotationParameters != null) {
    obscureAllButCenterDie = false;
    onFaceClicked = undefined;
  }
  return (
    <DiceKeyContainerToClipRotations $size={svgProps.$size}>
      <DiceKeySvgElement
        {...svgProps}
        {...rotationParameters}
        viewBox={viewBox((sizeModel.bounds))}
        preserveAspectRatio="xMidYMid meet"
      >
        <DiceKeySvgGroup {
          ...{faces,sizeModel,highlightFaceAtIndex,obscureAllButCenterDie,diceBoxColor,showLidTab,leaveSpaceForTab,onFaceClicked
          }} />
      </DiceKeySvgElement>
    </DiceKeyContainerToClipRotations>
  );
});
