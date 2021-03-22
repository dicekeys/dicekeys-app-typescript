
import React from "react";
import { observer } from "mobx-react";
import {
  letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes,
  Face,
  FaceLetters, 
  faceRotationLetterToClockwiseAngle,
  Point,
  UndoverlineCodes, getUndoverlineCodes,
  FaceDimensionsFractional
} from "@dicekeys/read-dicekey-js";
import { PartialDiceKey } from "../../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";

export enum UndoverlineType {
  underline = "underline",
  overline = "overline",
}

export function addUndoverlineCodes<T extends Partial<Face>>(face: T): T & (UndoverlineCodes | {}) {
  if (face.letter == null || face.digit == null) {
    return face;
  }
  const letterIndexTimesSixPlusDigitIndex = (FaceLetters.indexOf(face.letter) * 6) + (parseInt(face.digit) -1);
  const {underlineCode, overlineCode} = 
    letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[letterIndexTimesSixPlusDigitIndex];
  return Object.assign(face, {underlineCode, overlineCode});
}

const textShade = "#000000";
// const hiddenTextShade = "#B0B0B0";
const dieSurfaceColor = "#ffffff";
const dieSurfaceColorHighlighted = "rgb(222, 244, 64)"
 // actual Pantone color 07C = rgb(10,6,159), but actual product looks much darker than that purported equality
const diceBoxColor = "#050350"; // must be in hex format as it is parsed as such in this code.

export interface DiceKeyRenderOptions {
  highlightDieAtIndex?: number,
  diceBoxColor?: [number, number, number],
  showLidTab?: boolean,
  leaveSpaceForTab?: boolean
}

/**
 * Given an 11 bit underline/overline code, return an array of positions [0..10]
 * for those bits that are set to 1
 * @param code The 11-bit code
 * @returns Array of positions set to 1, where 0 is the highest order bit (1024)
 */
 const positionsSetOf11BitCode = (code: number) =>
 Array.from(Array(11).keys()).filter( pos => ((code >> (10 - pos)) & 1) != 0 )


const UndoverlineGroupView = ({lineType, code}: { lineType: "underline" | "overline", code: number | undefined }) => {
  if (typeof (code) === "undefined") {
    return null;
  }
  const isOverline = lineType == "overline";
  const lineTop =  (-FaceDimensionsFractional.undoverlineLength / 2) + (
    isOverline ?
    FaceDimensionsFractional.overlineTop : FaceDimensionsFractional.underlineTop
  );
  const undoverlineLeft = -FaceDimensionsFractional.undoverlineLength / 2;
  const firstDotLeft = -(FaceDimensionsFractional.undoverlineDotWidth * 11)/2;
  
  return (
    <g>
      <rect
          x={undoverlineLeft}
          y={lineTop}
          height={FaceDimensionsFractional.undoverlineThickness}
          width={FaceDimensionsFractional.undoverlineLength}
          fill={textShade}
          stroke='none'
      />
      { positionsSetOf11BitCode(code).map( (pos) => (
        <rect
          x={firstDotLeft + FaceDimensionsFractional.undoverlineDotWidth * pos}
          y={lineTop}
          width={FaceDimensionsFractional.undoverlineDotWidth}
          height={FaceDimensionsFractional.undoverlineDotHeight}
          fill={dieSurfaceColor}
          stroke={'none'}
        />
      ))
      }
    </g>
  );
};



/**
 * Render the face of a die by generating SVG elements for the text, underline, and overline
 * 
 * Scale such that the center is at zero and the area being written to is unit length 1,
 * so the tip of the top overline to the bottom of the underline is from -0.5 to 0.5.
 * 
 * Thus, the unit face can be scaled to an arbitrary size and then moved as needed.
 * 
 * @param face 
 */
const UnitFaceGroupView = observer( ({face}: {face: Partial<Face>}) => {
  const {letter, digit} = face;
  const {underlineCode, overlineCode} = letter && digit ?
    getUndoverlineCodes({letter, digit}) :
    ({} as {underlineCode: undefined, overlineCode: undefined});

  return (
    <g>
      <UndoverlineGroupView lineType={"underline"} code={underlineCode} />
      <UndoverlineGroupView lineType={"overline"} code={overlineCode} />
      <text
          x={0}
          y={-FaceDimensionsFractional.undoverlineLength / 2 + FaceDimensionsFractional.textBaselineY}
          fontFamily={FontFamily}
          fill={textShade}
          fontSize={FaceDimensionsFractional.fontSize}
          fontWeight={FontWeight}
          letterSpacing={`${FaceDimensionsFractional.spaceBetweenLetterAndDigit}px`}
          textAnchor={'middle'}
  //        textAlign={'center'}
  //        lineHeight={1}
          fillOpacity={1}
        ><tspan>{letter ?? ' ' + digit ?? ' '}</tspan
      ></text>
    </g>
  );
});

/**
 * Render a face including the white background of the die.
 * 
 * @param face The face to render
 * @param center The location of the face
 * @param linearFractionOfCoverage The linear fraction of the die that
 * is covered by drawing, such that the % is equal to the distance between
 * the top of the overline to the bottom of the underline as a fraction of the
 * distance from the top of the die to the bottom of the die.
 */
export const FaceGroupView = observer( ({
    face,
    center = {x: 0, y: 0},
    highlightThisDie = false,
    linearFractionOfCoverage = 5/8
  } : {
    face: Partial<Face>,
    center?: Point,
    highlightThisDie?: boolean,
    linearFractionOfCoverage?: number,
  }) => {
  const radius = 1 / 12;
  const clockwiseAngle = faceRotationLetterToClockwiseAngle(face.orientationAsLowercaseLetterTrbl || "?");
  return (
    <g transform={`translate(${center.x}, ${center.y})`}>
      <rect 
      x={-0.5} y={-0.5}
      width={1} height={1}
      rx={radius} ry={radius}
      fill={highlightThisDie ? dieSurfaceColorHighlighted : dieSurfaceColor}
      />

      <g transform={`scale(${linearFractionOfCoverage})${clockwiseAngle === 0 ? "" : ` rotate(${ clockwiseAngle }, 0, 0)`}`}>
        <UnitFaceGroupView face={face} />
      </g>
    </g>
  )
});


export const DiceKeyView = observer( ({
    diceKey, ...options
  }: {diceKey: PartialDiceKey} & DiceKeyRenderOptions
  ) => {
    const {
      showLidTab = false,
      leaveSpaceForTab =showLidTab
    } = options;
    const tabFraction = leaveSpaceForTab ? 0.1 : 0;

    const linearSizeOfFace = 1;
    const distanceBetweenFacesAsFractionOfLinearSizeOfFace = 0.2
    const marginOfBoxEdgeAsFractionOfLinearSizeOfFace = 1/8;
    const linearSizeOfBox = linearSizeOfFace * (
      5 +
      4 * distanceBetweenFacesAsFractionOfLinearSizeOfFace +
      2 * marginOfBoxEdgeAsFractionOfLinearSizeOfFace
    );
    const distanceBetweenDieCenters = linearSizeOfFace * (1 + distanceBetweenFacesAsFractionOfLinearSizeOfFace);
    const linearSizeOfBoxWithTab = linearSizeOfBox * (1 + tabFraction);

    const top = -linearSizeOfBox / 2;
    const left = -linearSizeOfBox / 2;
    const radius = linearSizeOfBox / 50;

    // var [r, g, b] = [1, 3, 5].map( start => parseInt( diceBoxColor.substr(start, 2), 16) );
    // const diceBoxColorRGB = {r, g, b};  
  
    return (
      <svg viewBox={`${left} ${top} ${linearSizeOfBox} ${linearSizeOfBoxWithTab}`}>
        { (!showLidTab) ? null : (
          // Lid tab as circle
          <circle
            cx={0} cy={top + linearSizeOfBox}
            r={tabFraction * linearSizeOfBox}
            fill={diceBoxColor}
          />
        )}
        // The blue dice box
        <rect
          x={left} y={top}
          width={linearSizeOfBox} height={linearSizeOfBox}
          rx={radius} ry={radius}
          fill={diceBoxColor}
        />
        {
          diceKey.map( (face, index) => (
            <FaceGroupView
              face={face}
              center={{
                x: distanceBetweenDieCenters * (-2 + (index % 5)),
                y: distanceBetweenDieCenters * (-2 + Math.floor(index / 5))}
              }
              highlightThisDie={options.highlightDieAtIndex == index}
            />
          ))
        }
      </svg>
    );
});
