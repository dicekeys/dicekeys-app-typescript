import React from "react";
import { observer } from "mobx-react";
import { Face } from "../../dicekeys/DiceKey";
import { FaceGroupView } from "./FaceView";
import { FaceDigit, FaceDigits, FaceIdentifiers, FaceLetter, FaceLetters } from "@dicekeys/read-dicekey-js";


const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 1/4;
const ratioOfPortraitSheetWidthToFaceSize = 5 + 6 * distanceBetweenFacesAsFractionOfLinearSizeOfFace;
const ratioOfPortraitSheetLengthToFaceSize = 6 + 7 * distanceBetweenFacesAsFractionOfLinearSizeOfFace;

class StickerSheetSizeModel {
  constructor(public readonly linearSizeOfFace: number = 1) {}

  static toFit = ({width, height}: {width?: number, height?: number}) => 
    new StickerSheetSizeModel(
      width != null && height != null ?
        Math.min(width / ratioOfPortraitSheetWidthToFaceSize, height / ratioOfPortraitSheetLengthToFaceSize) :
      height != null ? height :
      width != null ? width : ratioOfPortraitSheetLengthToFaceSize
    );

  width = this.linearSizeOfFace * ratioOfPortraitSheetWidthToFaceSize;
  height = this.linearSizeOfFace * ratioOfPortraitSheetLengthToFaceSize;
  distanceBetweenDieCenters = this.linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
  top = -this.height / 2;
  left = -this.width / 2;
  radius = 0;
}

interface StickerSheetViewProps {
  showLetter?: FaceLetter;
  highlightFaceWithDigit?: FaceDigit;
  hideFaces?: FaceIdentifiers[];
  sizeModel?: StickerSheetSizeModel;
}

const lettersPerStickySheet = 5;

export const StickerSheetSvgGroup = observer( (props: StickerSheetViewProps & {sizeModel: StickerSheetSizeModel}
  ) => {
    const {
      showLetter = "A",
      highlightFaceWithDigit,
      sizeModel = new StickerSheetSizeModel()
    } = props;
    const hideFaces = new Set<string>( (props.hideFaces ?? []).map( ({letter, digit}) => `${letter}${digit}`) );
    const hideFace = ({letter, digit}: {letter: string, digit: string}) =>
      hideFaces.has(`${letter}${digit}`);
  
    const letterIndex= Math.max(0, FaceLetters.indexOf(showLetter));
    const pageIndex = Math.floor(letterIndex / lettersPerStickySheet);
    const firstLetterIndex = pageIndex * lettersPerStickySheet;
    const lettersOnPage = FaceLetters.slice(firstLetterIndex, firstLetterIndex + lettersPerStickySheet);

    return (
      <g>/* Sticker Sheet */
        <rect
          x={sizeModel.left} y={sizeModel.top}
          width={sizeModel.width} height={sizeModel.height}
          rx={sizeModel.radius} ry={sizeModel.radius}
          stroke={"gray"}
          fill={"white"}
          strokeWidth={0.025}
        />
        {
          FaceDigits.map( (digit, digitIndex) => lettersOnPage.map( (letter, letterIndex) => {
            const key = letter + digit;
            const face: Face = {letter, digit, orientationAsLowercaseLetterTrbl: 't'};
            return (hideFace(face) ? null : (
              <FaceGroupView
                key={key} face={face}
                stroke={"rgba(128, 128, 128, 0.2)"}
                strokeWidth={sizeModel.linearSizeOfFace / 80}
                center={{
                  x: sizeModel.distanceBetweenDieCenters * (-2 + letterIndex),
                  y: sizeModel.distanceBetweenDieCenters * (-2.5 + digitIndex)}
                }
                highlightThisFace={showLetter === letter && highlightFaceWithDigit === digit}
            />))
          }).flat())
        }
      </g>
    );
});

export const StickerSheetView = observer( (props: StickerSheetViewProps) => {
    const {sizeModel = new StickerSheetSizeModel(), ...otherProps} = props;
    const viewBox = `${sizeModel.left} ${sizeModel.top} ${sizeModel.width} ${sizeModel.height}`
    return (
      <svg viewBox={viewBox}>
        <StickerSheetSvgGroup {...otherProps} sizeModel={sizeModel} />
      </svg>
    )    
});


export const Preview_StickerSheetView = () => (
  <StickerSheetView showLetter="G" highlightFaceWithDigit="2" hideFaces={[{letter: "I", digit: "3"}]} />
)