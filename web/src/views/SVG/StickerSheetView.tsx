import React from "react";
import { observer } from "mobx-react";
import { Face } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";
import { FaceDigit, FaceDigits, FaceIdentifiers, FaceLetter, FaceLetters } from "@dicekeys/read-dicekey-js";
import { fitRectangleWithAspectRatioIntoABoundingBox, Bounds, viewBox } from "../../utilities/bounding-rects";
import { OptionalMaxSizeCalcProps, WithBounds } from "../../utilities/WithBounds";


const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 1/4;
const ratioOfPortraitSheetWidthToFaceSize = 5 + 6 * distanceBetweenFacesAsFractionOfLinearSizeOfFace;
export const portraitSheetWidthOverHeight = 130 / 155; // sheets are manufactured 155mm x 130mm
const ratioOfPortraitSheetLengthToFaceSize =  ratioOfPortraitSheetWidthToFaceSize / portraitSheetWidthOverHeight;

const fitPortraitSheetIntoBounds = fitRectangleWithAspectRatioIntoABoundingBox(portraitSheetWidthOverHeight);

export const StickerSheetSizeModel = (linearSizeOfFace: number) => {
  const width = linearSizeOfFace * ratioOfPortraitSheetWidthToFaceSize;
  const height = linearSizeOfFace * ratioOfPortraitSheetLengthToFaceSize;
  const bounds = {width, height};
  const distanceBetweenDieCenters = linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  const top = -height / 2;
  const left = -width / 2;
  const radius = 0;
  return {linearSizeOfFace, width, height, bounds, distanceBetweenDieCenters, top, left, radius};
}
export type StickerSheetSizeModel = ReturnType<typeof StickerSheetSizeModel>;
export type StickerSheetSizeModelOptions = {linearSizeOfFace: number} | Bounds | {sizeModel: StickerSheetSizeModel};

export const StickerSheetSizeModelFromBounds = (bounds: Bounds) =>
 StickerSheetSizeModel(
  fitPortraitSheetIntoBounds(bounds).width / ratioOfPortraitSheetWidthToFaceSize
);

type StickerSheetViewProps = {
  showLetter?: FaceLetter;
  highlightFaceWithDigit?: FaceDigit;
  hideFaces?: FaceIdentifiers[];
}

const lettersPerStickySheet = 5;

export const StickerSheetSvgGroup = observer( (props: StickerSheetViewProps & Bounds & React.SVGAttributes<SVGGElement>) => {
    const {
      showLetter = "A",
      highlightFaceWithDigit,
      hideFaces,
      width: boundsWidth,
      height: boundsHeight,
      ...svgGroupProps
    } = props;
    const {
      top, left, width, height, radius, linearSizeOfFace, distanceBetweenDieCenters
    } = StickerSheetSizeModelFromBounds(props);
    const hideFacesSet = new Set<string>( (hideFaces ?? []).map( ({letter, digit}) => `${letter}${digit}`) );
    const hideFace = ({letter, digit}: {letter: string, digit: string}) =>
      hideFacesSet.has(`${letter}${digit}`);
  
    const letterIndex= Math.max(0, FaceLetters.indexOf(showLetter));
    const pageIndex = Math.floor(letterIndex / lettersPerStickySheet);
    const firstLetterIndex = pageIndex * lettersPerStickySheet;
    const lettersOnPage = FaceLetters.slice(firstLetterIndex, firstLetterIndex + lettersPerStickySheet);

    return (
      <g {...svgGroupProps}>/* Sticker Sheet */
        <rect
          key="Sheet"
          x={left} y={top}
          width={width} height={height}
          rx={radius} ry={radius}
          stroke={"gray"}
          fill={"white"}
          strokeWidth={linearSizeOfFace / 40}
        />
        {
          FaceDigits.map( (digit, digitIndex) => lettersOnPage.map( (letter, letterIndex) => {
            const key = letter + digit;
            const face: Face = {letter, digit, orientationAsLowercaseLetterTrbl: 't'};
            return (hideFace(face) ? null : (
              <FaceGroupView
                key={key} face={face}
                linearSizeOfFace={linearSizeOfFace}
                stroke={"rgba(128, 128, 128, 0.2)"}
                strokeWidth={linearSizeOfFace / 80}
                center={{
                  x: distanceBetweenDieCenters * (-2 + letterIndex),
                  y: distanceBetweenDieCenters * (-2.5 + digitIndex)}
                }
                highlightThisFace={showLetter === letter && highlightFaceWithDigit === digit}
            />))
          }).flat())
        }
      </g>
    );
});

export const StickerSheetView = observer( ({maxWidth, maxHeight, ...props}: StickerSheetViewProps & OptionalMaxSizeCalcProps) => (
    <WithBounds aspectRatioWidthOverHeight={portraitSheetWidthOverHeight} {...{maxWidth, maxHeight}}>{ ({bounds}) => {
    const sizeModel = StickerSheetSizeModelFromBounds(bounds);
    return (
      <svg viewBox={viewBox(bounds)}>
      <StickerSheetSvgGroup {...{...props, ...sizeModel.bounds}} showLetter="A" />
      </svg>
    )}}
    </WithBounds>
));


export const Preview_StickerSheetView = () => (
  <StickerSheetView {...{width: 500, height: 500}} showLetter="G" highlightFaceWithDigit="2" hideFaces={[{letter: "I", digit: "3"}]} />
)