import React from "react";
import { observer } from "mobx-react";
import { Face } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";
import { FaceDigit, FaceDigits, FaceIdentifiers, FaceLetter, FaceLetters } from "@dicekeys/read-dicekey-js";
import { fitRectangleWithAspectRatioIntoABoundingBox, Bounds } from "../../utilities/bounding-rects";


const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 1/4;
const ratioOfPortraitSheetWidthToFaceSize = 5 + 6 * distanceBetweenFacesAsFractionOfLinearSizeOfFace;
const portraitSheetWidthOverHeight = 130 / 155; // sheets are manufactured 155mm x 130mm
const ratioOfPortraitSheetLengthToFaceSize =  ratioOfPortraitSheetWidthToFaceSize / portraitSheetWidthOverHeight;

const fitPortraitSheetIntoBounds = fitRectangleWithAspectRatioIntoABoundingBox(portraitSheetWidthOverHeight);
export type StickerSheetSizeModelOptions = {linearSizeOfFace: number} | Bounds | {sizeModel: StickerSheetSizeModel};

export class StickerSheetSizeModel {
  constructor(public readonly linearSizeOfFace: number) {}

  width = this.linearSizeOfFace * ratioOfPortraitSheetWidthToFaceSize;
  height = this.linearSizeOfFace * ratioOfPortraitSheetLengthToFaceSize;
  distanceBetweenDieCenters = this.linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  top = -this.height / 2;
  left = -this.width / 2;
  radius = 0;

  static fromOptions = (arg: StickerSheetSizeModelOptions): StickerSheetSizeModel =>
    "sizeModel" in arg ? arg.sizeModel :
    new StickerSheetSizeModel(
      "linearSizeOfFace" in arg && typeof arg.linearSizeOfFace === "number" ? arg.linearSizeOfFace :
      fitPortraitSheetIntoBounds(arg as Bounds).width / ratioOfPortraitSheetWidthToFaceSize
    );
}

type StickerSheetViewProps = StickerSheetSizeModelOptions & {
  showLetter?: FaceLetter;
  highlightFaceWithDigit?: FaceDigit;
  hideFaces?: FaceIdentifiers[];
  sizeModel?: StickerSheetSizeModel;
}

const lettersPerStickySheet = 5;

export const StickerSheetSvgGroup = observer( (props: StickerSheetViewProps & {sizeModel: StickerSheetSizeModel} & React.SVGAttributes<SVGGElement>) => {
    const {
      showLetter = "A",
      highlightFaceWithDigit,
      hideFaces,
      ...svgGroupProps
    } = props;
    const {
      top, left, width, height, radius, linearSizeOfFace, distanceBetweenDieCenters
    } = StickerSheetSizeModel.fromOptions(props);
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

export const StickerSheetView = observer( (props: StickerSheetViewProps) => {
    const sizeModel = StickerSheetSizeModel.fromOptions(props);
    const viewBox = `${sizeModel.left} ${sizeModel.top} ${sizeModel.width} ${sizeModel.height}`
    return (
      <svg viewBox={viewBox}>
        <StickerSheetSvgGroup {...{...props, sizeModel}} />
      </svg>
    )    
});


export const Preview_StickerSheetView = () => (
  <StickerSheetView linearSizeOfFace={1} showLetter="G" highlightFaceWithDigit="2" hideFaces={[{letter: "I", digit: "3"}]} />
)