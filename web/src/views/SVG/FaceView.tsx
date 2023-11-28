import React from "react";
import { observer } from "mobx-react";
import {
  letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes,
  FaceLetters, 
  faceRotationLetterToClockwiseAngle,
  Point,
  UndoverlineCodes, getUndoverlineCodes,
  FaceDimensionsFractional
} from "@dicekeys/read-dicekey-js";
import { OrientedFace } from "../../dicekeys/DiceKey";
import {EventHandlerOverridesDefault} from "../../utilities/EventHandlerOverridesDefault"
export const FontFamily = "Inconsolata";
export const FontWeight = "700";

export enum UndoverlineType {
  underline = "underline",
  overline = "overline",
}

export function addUndoverlineCodes<T extends Partial<OrientedFace>>(face: T): T & (UndoverlineCodes | object) {
  if (face.letter == null || face.digit == null) {
    return face;
  }
  const letterIndexTimesSixPlusDigitIndex = (FaceLetters.indexOf(face.letter) * 6) + (parseInt(face.digit) -1);
  const faceWithOverlineCodes = letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[letterIndexTimesSixPlusDigitIndex];
  if (faceWithOverlineCodes == null) {
    return face;
  }
  const {underlineCode, overlineCode} = faceWithOverlineCodes;
  return Object.assign(face, {underlineCode, overlineCode});
}

const textShade = "#000000";
// const hiddenTextShade = "#B0B0B0";
const dieSurfaceColor = "#ffffff";
const dieSurfaceColorHighlighted = "rgb(222, 244, 64)"

/**
 * Given an 11 bit underline/overline code, return an array of positions [0..10]
 * for those bits that are set to 1
 * @param code The 11-bit code
 * @returns Array of positions set to 1, where 0 is the highest order bit (1024)
 */
 const positionsSetOf11BitCode = (code: number) =>
 Array.from(Array(11).keys()).filter( pos => ((code >> (10 - pos)) & 1) != 0 )


const UndoverlineGroupView = ({
  lineType, code,
  strokeColor = textShade,
  backgroundColor = dieSurfaceColor,
}: { lineType: "underline" | "overline", code: number | undefined, strokeColor?: string, backgroundColor?: string }) => {
  if (typeof (code) === "undefined") {
    return null;
  }
  const isOverline = lineType == "overline";

  const lineTop =  (-FaceDimensionsFractional.undoverlineLength / 2) + (
    isOverline ?
    FaceDimensionsFractional.overlineTop : FaceDimensionsFractional.underlineTop
  );
  const dotTop = lineTop + (FaceDimensionsFractional.undoverlineThickness - FaceDimensionsFractional.undoverlineDotHeight)/2;
  const undoverlineLeft = -FaceDimensionsFractional.undoverlineLength / 2;
  const firstDotLeft = -(FaceDimensionsFractional.undoverlineDotWidth * 11)/2;

  const codeWithPositionSymbols = 1024 | (isOverline ? 512 : 0) | (code << 1);
  
  return (
    <g>
      <rect
        key={"UndoverlineBackground"}
        x={undoverlineLeft}
        y={lineTop}
        height={FaceDimensionsFractional.undoverlineThickness}
        width={FaceDimensionsFractional.undoverlineLength}
        fill={strokeColor}
        stroke='none'
      />
      { positionsSetOf11BitCode(codeWithPositionSymbols).map( (pos) => (
        <rect
          key={`position ${pos}`}
          x={firstDotLeft + FaceDimensionsFractional.undoverlineDotWidth * pos}
          y={dotTop}
          width={FaceDimensionsFractional.undoverlineDotWidth}
          height={FaceDimensionsFractional.undoverlineDotHeight}
          fill={backgroundColor}
          stroke={'none'}
        />
      ))
      }
    </g>
  );
}

const UnderlineGroupView = (props: Omit<React.ComponentProps<typeof UndoverlineGroupView>, "lineType"> ) => (
  <UndoverlineGroupView lineType={"underline"} {...props} />
)
const OverlineGroupView = (props: { code: number | undefined }) => (
  <UndoverlineGroupView lineType={"overline"} {...props} />
)



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
const UnitFaceGroupView = observer ( ({
  face,
  strokeColor = textShade,
  backgroundColor,
  ...svgGroupProps}: {
  face: Partial<OrientedFace>;
  strokeColor?: string;
  backgroundColor?: string;
} &
  React.SVGAttributes<SVGGElement>
) => {
  const {letter, digit} = face;
  const {underlineCode, overlineCode} = letter && digit ?
    getUndoverlineCodes({letter, digit}) :
    ({} as {underlineCode: undefined, overlineCode: undefined});

  return (
    <g {...svgGroupProps} >
      <UnderlineGroupView code={underlineCode} {...{strokeColor, backgroundColor}} />
      <OverlineGroupView code={overlineCode} {...{strokeColor, backgroundColor}} />
      <text
          x={0}
          y={-FaceDimensionsFractional.undoverlineLength / 2 + FaceDimensionsFractional.textBaselineY}
          fontFamily={FontFamily}
          fill={strokeColor}
          style={{userSelect: "none"}}
          fontSize={FaceDimensionsFractional.fontSize}
          fontWeight={FontWeight}
          letterSpacing={`${FaceDimensionsFractional.spaceBetweenLetterAndDigit}px`}
          textAnchor={'middle'}
          fillOpacity={1}
        ><tspan>{(letter ?? ' ') + (digit ?? ' ')}</tspan
      ></text>
    </g>
  );
});


interface FaceViewProps {
  face: Partial<OrientedFace>;
  highlightThisFace?: boolean;
  backgroundColor?: string;
  strokeColor?: string;
  strokeWidth?: string | number;
  onFaceClicked?: () => void;
}

interface FaceGroupViewProps extends FaceViewProps {
  center?: Point;
  linearSizeOfFace?: number;
  linearFractionOfCoverage?: number;
  doNotDrawBackground?: boolean;
  transform?: string;
}

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
    highlightThisFace = false,
    strokeColor = textShade,
    strokeWidth = 0,
    transform,
    backgroundColor = dieSurfaceColor,
    linearSizeOfFace = 1,
    doNotDrawBackground = false,
    linearFractionOfCoverage = 5/8,
    onFaceClicked,
    ...svgGroupProps
  } : FaceGroupViewProps ) => { /*  & React.SVGAttributes<SVGGElement> */
  const radius = linearSizeOfFace / 12;
  const clockwiseAngle = faceRotationLetterToClockwiseAngle(face.orientationAsLowercaseLetterTrbl || "?");
  const optionalOnClickHandler = onFaceClicked ? {onClick: EventHandlerOverridesDefault(onFaceClicked)} : {};
  return (
    <g transform={transform != null ? transform : center ? `translate(${center.x}, ${center.y})` : undefined}
        {...svgGroupProps}
        {...optionalOnClickHandler}
        style={!!onFaceClicked ? {cursor: "pointer"} : {}}
    >
      { doNotDrawBackground ? null : (
      <rect 
        x={-linearSizeOfFace/2} y={-linearSizeOfFace/2}
        width={linearSizeOfFace} height={linearSizeOfFace}
        rx={radius} ry={radius}
        fill={highlightThisFace ? dieSurfaceColorHighlighted : backgroundColor}
        stroke={strokeColor}
        {...{strokeWidth}}
      />) }

      <g transform={`scale(${linearSizeOfFace * linearFractionOfCoverage})${clockwiseAngle === 0 ? "" : ` rotate(${ clockwiseAngle }, 0, 0)`}`}>
        <UnitFaceGroupView {...{face, strokeColor, backgroundColor}} />
      </g>
    </g>
  )
});

export const FaceSvg = observer( ({title, size, ...props}: FaceGroupViewProps & {title?: string; size: string}) => {
  const {
    center = {x: 0, y: 0},
    linearSizeOfFace = 1
  } = props;
  const left = center.x - linearSizeOfFace / 2;
  const top = center.y - linearSizeOfFace / 2;
  return (
  <svg height={`${size}`} width={`${size}`} viewBox={`${left}, ${top}, ${linearSizeOfFace}, ${linearSizeOfFace}`} >
    { title == null ? null : (<title>{title}</title>) }
    <FaceGroupView {...props} />
  </svg>
  )
});


export const FaceView = ({
    face, highlightThisFace, backgroundColor, strokeColor, strokeWidth, onFaceClicked,
    ...svgProps
  }: FaceViewProps & React.SVGAttributes<SVGElement>) => (
  <svg width={`100%`} height={`100%`} {...svgProps}>
    <FaceGroupView {...{face, highlightThisFace, backgroundColor, strokeColor, strokeWidth, onFaceClicked}} />
  </svg>
);
