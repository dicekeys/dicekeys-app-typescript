import React from "react";
import { observer } from "mobx-react";
import { DiceKey, Face, PartialDiceKey } from "../../dicekeys/DiceKey";
import { StickerTargetSheetSvgGroup } from "./StickerTargetSheetView";
import { DiceKeySizeModel, DiceKeySvgGroup } from "./DiceKeyView";
import { StickerSheetSizeModel, StickerSheetSvgGroup, portraitSheetWidthOverHeight } from "./StickerSheetView";
import { Bounds, fitRectangleWithAspectRatioIntoABoundingBox, viewBox } from "../../utilities/bounding-rects";
import HandWithSticker from /*url:*/"../../images/Hand with Sticker.svg";
import { FaceGroupView } from "./FaceView";
import { weightsToFractionalProportions, sum } from "../../utilities/weights";
import { OptionalMaxSizeCalcProps, WithBounds } from "../../utilities/WithBounds";

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


const widthsInUnitsOf1KeyWidth = [
  1, // source sticker sheet
  0.4, // space between sticker sheets
  1, // target sheet on right
];
const fractionalWidths = weightsToFractionalProportions(...widthsInUnitsOf1KeyWidth);
const totalWidthInUnitsOf1KeyWidth = sum(widthsInUnitsOf1KeyWidth);

const sticKeyFaceCopyingImageWidthOverHeight = portraitSheetWidthOverHeight * totalWidthInUnitsOf1KeyWidth;
const diceKeyFaceCopyingImageWidthOverHeight = 1 /* dice key with no lid width/height (a square) */ * totalWidthInUnitsOf1KeyWidth;
const fitStiKeyFaceCopyingImageIntoBounds = fitRectangleWithAspectRatioIntoABoundingBox(sticKeyFaceCopyingImageWidthOverHeight);
const fitDiceKeyFaceCopyingImageIntoBounds = fitRectangleWithAspectRatioIntoABoundingBox(diceKeyFaceCopyingImageWidthOverHeight);


type FaceCopyingViewProps = {
  diceKey?: DiceKey,
  medium: "SticKey" | "DiceKey",
  matchSticKeyAspectRatio?: boolean,
  showArrow?: boolean,
  indexOfLastFacePlaced?: number,
}; //  & React.SVGAttributes<SVGGElement>
const FaceCopyingViewGroup = observer ( (props: FaceCopyingViewProps & Bounds) => {
  const {
    diceKey, medium, matchSticKeyAspectRatio, indexOfLastFacePlaced, showArrow,
  } = props;
  const hideFaces = diceKey?.faces.slice(0, indexOfLastFacePlaced ?? -1);
  const bounds = medium === "SticKey" ?
    fitStiKeyFaceCopyingImageIntoBounds(props) :
    fitDiceKeyFaceCopyingImageIntoBounds(props);
  const {width, height} = bounds;
  const face = diceKey?.faces[indexOfLastFacePlaced ?? -1] as Face | undefined;
  const modelBounds = {width: width * fractionalWidths[0], height: height};
  const stickerSheetSizeModel = StickerSheetSizeModel.fromBounds(modelBounds);
  const diceKeySizeModel = DiceKeySizeModel.fromBoundsWithoutTab( matchSticKeyAspectRatio ?
    // Adjust height from 6-face hight to 5 face height
    {width: modelBounds.width, height: modelBounds.height - stickerSheetSizeModel.linearSizeOfFace}:
    modelBounds);
  const sheetSizeModel = (medium === "SticKey") ? stickerSheetSizeModel : diceKeySizeModel;
  const xoffsetImageCenterToLeftSheetCenter = -width * (fractionalWidths[0] + fractionalWidths[1])/2;
  const xoffsetImageCenterToRightSheetCenter = width * (fractionalWidths[1] + fractionalWidths[2])/2;
  const scaleOfHandImage = sheetSizeModel.linearSizeOfFace / handImageSVGWidthOfFace;
  const faceIndexX = (indexOfLastFacePlaced ?? 0) % 5;
  const faceIndexY = Math.floor((indexOfLastFacePlaced ?? 0) / 5);
  const translateToDieCenter = `translate(${
      xoffsetImageCenterToRightSheetCenter + (-2 + faceIndexX) * sheetSizeModel.distanceBetweenDieCenters
    }, ${
      (-2 + faceIndexY) * sheetSizeModel.distanceBetweenDieCenters
    })`;

  return (
    <g>
      { medium === "SticKey" ? (<>
        <StickerSheetSvgGroup {...stickerSheetSizeModel.bounds} showLetter={face?.letter} hideFaces={hideFaces} highlightFaceWithDigit={face?.digit}
          transform={`translate(${xoffsetImageCenterToLeftSheetCenter})`}
        />
        <StickerTargetSheetSvgGroup
          {...stickerSheetSizeModel.bounds} diceKey={diceKey}
            sizeModel={stickerSheetSizeModel}
            indexOfLastFacePlaced={indexOfLastFacePlaced}
            highlightThisFace={indexOfLastFacePlaced}
          transform={`translate(${xoffsetImageCenterToRightSheetCenter}, 0)`}
        />        
      </>) : medium === "DiceKey" ? (<>
        <DiceKeySvgGroup
          faces={diceKey?.faces}
          {...diceKeySizeModel.bounds}
          highlightFaceAtIndex={indexOfLastFacePlaced}
          transform={`translate(${xoffsetImageCenterToLeftSheetCenter})`}
        />
        <DiceKeySvgGroup
          faces={diceKey?.faces.map( (face, index) =>
            index <= (indexOfLastFacePlaced ?? 24) ? face : {} ) as PartialDiceKey
          }
          {...diceKeySizeModel.bounds}
          highlightFaceAtIndex={indexOfLastFacePlaced}
          transform={`translate(${xoffsetImageCenterToRightSheetCenter}, 0)`}
        />              
      </>) : (<></>)}
      { showArrow !== true ? (<></>) : (
        <text textAnchor={'middle'} fontSize={sheetSizeModel.linearSizeOfFace * 1.5} y={sheetSizeModel.linearSizeOfFace * .6} >
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
            backgroundColor="rgba(0,0,0,0)" // transparent
            strokeWidth={0}
            stroke={"rgba(0,0,0,0)"}
            face={face}
            linearSizeOfFace={sheetSizeModel.linearSizeOfFace}
          />
        </>
      )}
    </g>
  );
});

const aspectRatioWidthOverHeight = portraitSheetWidthOverHeight * totalWidthInUnitsOf1KeyWidth;

export const FaceCopyingView = observer( ({
  maxHeight, maxWidth, ...props
}: FaceCopyingViewProps & OptionalMaxSizeCalcProps) => {
  return (
    <WithBounds {...{aspectRatioWidthOverHeight, maxHeight, maxWidth}}>{ (({bounds}) => (
      <svg viewBox={viewBox(bounds)}>
        <FaceCopyingViewGroup {...{...props, ...bounds}} />
      </svg>
    ))}</WithBounds>
  )    
});

export const DiceKeyCopyingView = observer( (props: Omit<FaceCopyingViewProps, "medium">) => (
  <FaceCopyingView {...{...props, medium: "DiceKey"}} />
));
export const SticKeyCopyingView = observer( (props: Omit<FaceCopyingViewProps, "medium">) => (
  <FaceCopyingView {...{...props, medium: "SticKey"}} />
));

export const Preview_FaceCopyingView = ({indexOfLastFacePlaced=23}: {indexOfLastFacePlaced?: number}) => (
  <>
    <DiceKeyCopyingView diceKey={DiceKey.testExample} indexOfLastFacePlaced={indexOfLastFacePlaced} />
    <SticKeyCopyingView diceKey={DiceKey.testExample} matchSticKeyAspectRatio={true} indexOfLastFacePlaced={indexOfLastFacePlaced} />
  </>
)