import React from "react";
import { observer } from "mobx-react";
import { DiceKey, DiceKeyWithoutKeyId, OrientedFace, PartialDiceKey } from "../../dicekeys/DiceKey";
import { StickerTargetSheetSvgGroup } from "./StickerTargetSheetView";
import { DiceKeySizeModelForFaceAsUnit, DiceKeySvgGroup } from "./DiceKeyView";
import { StickerSheetSvgGroup, StickerSheetSizeModelForFaceAsUnit } from "./StickerSheetView";
import { viewBox } from "../../utilities/bounding-rects";
import HandWithSticker from /*url:*/ "../../images/Hand with Sticker.svg";
import { FaceGroupView } from "./FaceView";
import { weightsToFractionalProportions, sum } from "../../utilities/weights";
import { BooleanWithToggle } from "../../state/stores/HideRevealSecretsState";
import { HandGeneratedBackupMedium, HandGeneratedBackupMediumDice, HandGeneratedBackupMediumStickers } from "../../dicekeys/PhysicalMedium";

// Hand with sticker is 219wide x 187 high
const handImageSVGHeight = 187;
const handImageSVGWidth = 219;
// const handWithStickerWidthOverHeight = handImageSVGWidth/handImageSVGHeight;
const handImageSVGWidthAsFractionOfFaceSize = 8.85;
const handImageSVGWidthOfFace = handImageSVGWidth / handImageSVGWidthAsFractionOfFaceSize;
const handImageOffsetToCenterOfDie = {
            width: (0.5 - 0.3695) * handImageSVGWidth,
            height: (0.5 - 0.2845) * handImageSVGHeight,
};

/**
 * Copying view is 2.4 key width (or sticker sheet) wide
 * and 1 sticker sheet or key width high.
 */
const widthsInUnitsOf1KeyWidth = [
  1, // source sticker sheet
  0.4, // space between sticker sheets
  1, // target sheet on right
] as const;
const fractionalWidths = weightsToFractionalProportions<3>(...widthsInUnitsOf1KeyWidth);
const totalWidthInUnitsOf1KeyWidth = sum(widthsInUnitsOf1KeyWidth);

const FaceCopyingViewBounds = (medium: HandGeneratedBackupMedium): {width: number, height: number} =>
  medium === HandGeneratedBackupMediumStickers ? {
    width: StickerSheetSizeModelForFaceAsUnit.width * totalWidthInUnitsOf1KeyWidth,
    height: StickerSheetSizeModelForFaceAsUnit.height
  } : {
    width: DiceKeySizeModelForFaceAsUnit.width * totalWidthInUnitsOf1KeyWidth,
    height: DiceKeySizeModelForFaceAsUnit.height
  }

type FaceCopyingViewProps = {
  diceKey?: DiceKey,
  medium: HandGeneratedBackupMedium,
  showArrow?: boolean,
  indexOfLastFacePlaced?: number,
  obscureAllButCenterDie: boolean | BooleanWithToggle
};
const FaceCopyingViewGroup = observer ( (props: FaceCopyingViewProps) => {
  const {
    diceKey, medium, indexOfLastFacePlaced, showArrow, obscureAllButCenterDie // matchSticKeyAspectRatio, 
  } = props;
  const hideFaces = diceKey?.faces.slice(0, indexOfLastFacePlaced ?? -1);
  const targetSizeModel = medium === HandGeneratedBackupMediumStickers ?
    StickerSheetSizeModelForFaceAsUnit :
    DiceKeySizeModelForFaceAsUnit;
  const imageWidth = FaceCopyingViewBounds(props.medium).width;
  const face = diceKey?.faces[indexOfLastFacePlaced ?? -1] as OrientedFace | undefined;
  const xoffsetImageCenterToLeftSheetCenter = -imageWidth * (fractionalWidths[0] + fractionalWidths[1])/2;
  const xoffsetImageCenterToRightSheetCenter = imageWidth * (fractionalWidths[1] + fractionalWidths[2])/2;
  const scaleOfHandImage = targetSizeModel.linearSizeOfFace / handImageSVGWidthOfFace;
  const faceIndexX = (indexOfLastFacePlaced ?? 0) % 5;
  const faceIndexY = Math.floor((indexOfLastFacePlaced ?? 0) / 5);
  const translateToDieCenter = `translate(${
      xoffsetImageCenterToRightSheetCenter + (-2 + faceIndexX) * targetSizeModel.distanceBetweenDieCenters
    }, ${
      (-2 + faceIndexY) * targetSizeModel.distanceBetweenDieCenters
    })`;

  return (
    <g>
      { medium === HandGeneratedBackupMediumStickers ? (<>
        <StickerSheetSvgGroup {...targetSizeModel.bounds} showLetter={face?.letter} hideFaces={hideFaces} highlightFaceWithDigit={face?.digit}
          transform={`translate(${xoffsetImageCenterToLeftSheetCenter})`}
        />
        <StickerTargetSheetSvgGroup
          {...targetSizeModel.bounds} diceKey={diceKey}
            sizeModel={targetSizeModel}
            indexOfLastFacePlaced={indexOfLastFacePlaced}
            highlightThisFace={indexOfLastFacePlaced}
            transform={`translate(${xoffsetImageCenterToRightSheetCenter}, 0)`}
        />        
      </>) : medium === HandGeneratedBackupMediumDice ? (<>
        <DiceKeySvgGroup
          faces={diceKey?.faces}
          sizeModel={DiceKeySizeModelForFaceAsUnit}
          {...targetSizeModel.bounds}
          highlightFaceAtIndex={indexOfLastFacePlaced}
          transform={`translate(${xoffsetImageCenterToLeftSheetCenter})`}
          obscureAllButCenterDie={obscureAllButCenterDie}
        />
        <DiceKeySvgGroup
          sizeModel={DiceKeySizeModelForFaceAsUnit}
          faces={diceKey?.faces.map( (face, index) =>
            index <= (indexOfLastFacePlaced ?? 24) ? face : {} ) as PartialDiceKey
          }
          {...targetSizeModel.bounds}
          highlightFaceAtIndex={indexOfLastFacePlaced}
          transform={`translate(${xoffsetImageCenterToRightSheetCenter}, 0)`}
          obscureAllButCenterDie={false}
        />              
      </>) : (<></>)}
      { showArrow !== true ? (<></>) : (
        <text textAnchor={'middle'} fontSize={targetSizeModel.linearSizeOfFace * 1.5} y={targetSizeModel.linearSizeOfFace * .6} >
          <tspan>
            &#x21e8;
          </tspan>
        </text>)
      }{ face == null ? (<></>) : (
        <>
          <image href={HandWithSticker}
            transform={
              // Lastly (transforms are in reverse order), move the image over the correct face
              translateToDieCenter +
              // Second, scale the image to make face sizes match
              ` scale(${scaleOfHandImage})` +
              // First, translate image so that the center of the die face is the center of the image
              ` translate(${-handImageOffsetToCenterOfDie.width},${-handImageOffsetToCenterOfDie.height})`
            }
          />
          <FaceGroupView
            transform={translateToDieCenter + `rotate(-0.7)`}
            doNotDrawBackground={true}
//            backgroundColor="rgba(0,0,0,0)" // transparent
            strokeWidth={0}
            strokeColor={"rgba(0,108,0,1)"}
            face={face}
            linearSizeOfFace={targetSizeModel.linearSizeOfFace}
          />
        </>
      )}
    </g>
  );
});

export const FaceCopyingView = observer( ({
  diceKey, medium, indexOfLastFacePlaced, showArrow, obscureAllButCenterDie, ...svgProps
}: FaceCopyingViewProps & React.SVGAttributes<SVGGElement>) => (
  <svg {...svgProps} viewBox={viewBox(FaceCopyingViewBounds(medium))}>
    <FaceCopyingViewGroup {...{diceKey, medium, indexOfLastFacePlaced, showArrow, obscureAllButCenterDie}} />
  </svg>
));

export const DiceKeyCopyingView = observer( (props: Omit<FaceCopyingViewProps, "medium">) => (
  <FaceCopyingView {...{...props, medium: HandGeneratedBackupMediumDice}} />
));
export const SticKeyCopyingView = observer( (props: Omit<FaceCopyingViewProps, "medium">) => (
  <FaceCopyingView {...{...props, medium: HandGeneratedBackupMediumStickers}} />
));

export const Preview_FaceCopyingView = ({indexOfLastFacePlaced=23}: {indexOfLastFacePlaced?: number}) => (
  <>
    <DiceKeyCopyingView obscureAllButCenterDie={false} diceKey={DiceKeyWithoutKeyId.testExample} indexOfLastFacePlaced={indexOfLastFacePlaced} />
    <SticKeyCopyingView obscureAllButCenterDie={false} diceKey={DiceKeyWithoutKeyId.testExample} indexOfLastFacePlaced={indexOfLastFacePlaced} />
  </>
)