import React from "react";
import { observer } from "mobx-react";
import { OrientedFace } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";
import { FaceDigit, FaceDigits, FaceLetter, FaceLetters, Face } from "../../dicekeys/DiceKey";
import { Bounds, viewBox } from "../../utilities/bounding-rects";


export const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 1/4;
export const portraitSheetWidthOverHeight = 130 / 155; // sheets are manufactured 155mm x 130mm

const stickerSheetPortraitWidthInUnitsOfFaceStickerSize = 5 + 6 * distanceBetweenFacesAsFractionOfLinearSizeOfFace;
const stickerSheetPortraitHeightInUnitsOfFaceStickerSize =  stickerSheetPortraitWidthInUnitsOfFaceStickerSize / portraitSheetWidthOverHeight;

export const stickerSheetPortraitDimensionsInUnitsOfFaceSize = {
  width: stickerSheetPortraitWidthInUnitsOfFaceStickerSize,
  height: stickerSheetPortraitHeightInUnitsOfFaceStickerSize
} as const;

// const fitPortraitSheetIntoBounds = fitRectangleWithAspectRatioIntoABoundingBox(portraitSheetWidthOverHeight);

const StickerSheetSizeModel = (linearSizeOfFace: number) => {
  const width = linearSizeOfFace * stickerSheetPortraitWidthInUnitsOfFaceStickerSize;
  const height = linearSizeOfFace * stickerSheetPortraitHeightInUnitsOfFaceStickerSize;
  const bounds = {width, height};
  const distanceBetweenDieCenters = linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  const top = -height / 2;
  const left = -width / 2;
  const radius = 0;
  return {linearSizeOfFace, width, height, bounds, distanceBetweenDieCenters, top, left, radius};
}
export type StickerSheetSizeModel = ReturnType<typeof StickerSheetSizeModel>;
export type StickerSheetSizeModelOptions = {linearSizeOfFace: number} | Bounds | {sizeModel: StickerSheetSizeModel};

export const StickerSheetSizeModelForFaceAsUnit = StickerSheetSizeModel(1);

// export const StickerSheetSizeModelFromBounds = (bounds: Bounds) =>
//  StickerSheetSizeModel(
//   fitPortraitSheetIntoBounds(bounds).width / stickerSheetPortraitWidthInUnitsOfFaceStickerSize
// );

type StickerSheetViewProps = {
  showLetter?: FaceLetter;
  highlightFaceWithDigit?: FaceDigit;
  hideFaces?: Face[];
  strokeColor?: string;
}

const lettersPerStickySheet = 5;

export const StickerSheetSvgGroup = observer( (props: StickerSheetViewProps & React.SVGAttributes<SVGGElement>) => {
    const {
      showLetter = "A",
      highlightFaceWithDigit,
      hideFaces,
      strokeColor,
      ...svgGroupProps
    } = props;
    const {
      top, left, width, height, radius, linearSizeOfFace, distanceBetweenDieCenters
    } = StickerSheetSizeModelForFaceAsUnit;
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
            const face: OrientedFace = {letter, digit, orientationAsLowercaseLetterTrbl: 't'};
            return (hideFace(face) ? null : (
              <FaceGroupView
                key={key} face={face}
                linearSizeOfFace={linearSizeOfFace}
                strokeColor={strokeColor}
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

export const StickerSheetView = observer( ({
  showLetter, highlightFaceWithDigit, hideFaces, strokeColor,...svgProps
}: StickerSheetViewProps & React.SVGAttributes<SVGGElement>) => (
  <svg {...svgProps} viewBox={viewBox(StickerSheetSizeModelForFaceAsUnit.bounds)}>
    <StickerSheetSvgGroup {...{showLetter, highlightFaceWithDigit, hideFaces, strokeColor}} />
  </svg>
));


export const Preview_StickerSheetView = () => (
  <StickerSheetView {...{width: 500, height: 500}} showLetter="G" highlightFaceWithDigit="2" hideFaces={[{letter: "I", digit: "3"}]} />
)