import {FaceLetter, FaceLetters, FaceDigit, Face, FaceOrientationLetterTrbl} from "./face";
import {letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes} from "./undoverline-tables";
import {FaceDimensionsFractional} from "./face-dimensions";
export const round = (x: number, precision: number = 10000000000) => Math.round(x * precision) / precision;
export const FontFamily = "Inconsolata";
export const FontWeight = "700";

export const undoverlineBitPositions = (
  {type, letter, digit}: {type: "underline" | "overline", letter: FaceLetter | undefined, digit: FaceDigit | undefined}
): number[] => {
  if (letter == null || digit == null) {
    return [];
  }
  const letterIndexTimesSixPlusDigitIndex = (FaceLetters.indexOf(letter) * 6) + (parseInt(digit) -1);
  const FaceSpecification = letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[letterIndexTimesSixPlusDigitIndex];
  const bits = type == "underline" ?
    (0x400 | (FaceSpecification.underlineCode << 1)) :
    (0x600 | (FaceSpecification.overlineCode << 1));
  // const bits = undoverlineBits(params)
  const positions = [] as number[];
  for (let i=0; i < 11; i++) {
    if ( ( bits & (1 << (10 - i)) ) != 0 ) {
      positions.push(i);
    }
  }
  return positions;
}

export interface Transform {
    x?: number;
    y?: number;
}

export interface Size {
  linearSizeOfFace: number;
  linearSizeOfFacesPrintArea: number;
}

export interface ElementRenderOptions {
  bgColor?: string;
  printColor?: string;
  borderWidth?: number | undefined;
  borderColor?: string | undefined;
  borderRadius?: number | string | undefined;
}

export const renderFaceTextUpright = ({
  letter, digit, printColor = "#000000"
}: Face & Transform & Size & ElementRenderOptions) => `${""
}<text y="${FaceDimensionsFractional.textBaselineY
}" x="${FaceDimensionsFractional.center
}" style="font-family:fill:${printColor};${FontFamily};font-size:${FaceDimensionsFractional.fontSize}px;font-weight:${FontWeight};letter-spacing:${FaceDimensionsFractional.spaceBetweenLetterAndDigit}px;text-anchor:middle;text-align:center;line-height:1;fill-opacity:1;"${""
}><tspan>${letter}${digit}</tspan>${""
}</text>`;

export const renderFaceSurface = ({
  letter, digit, linearSizeOfFace, linearSizeOfFacesPrintArea, x= 0, y = 0, orientationAsLowercaseLetterTRBL = "?",
  bgColor = "#ffffff", printColor = "#000000", borderColor = "#000000",
  borderWidth = 0,
  borderRadius = 0 
}: Face & Transform & Size & ElementRenderOptions) => {
  const renderWhiteBox = (spacesFromLeftEdge: number, numberOfConsecutiveSquares: number, above: boolean) => {
    return `<rect
      id="bit_code_for_${letter}${digit}_${above ? "overline": "underline"}_${spacesFromLeftEdge}"
      y="${round(above ? FaceDimensionsFractional.overlineDotTop : FaceDimensionsFractional.underlineDotTop)}"
      x="${round( FaceDimensionsFractional.undoverlineFirstDotLeftEdge + spacesFromLeftEdge * FaceDimensionsFractional.undoverlineDotWidth )}"
      height="${round(FaceDimensionsFractional.undoverlineDotHeight)}"
      width="${round(FaceDimensionsFractional.undoverlineDotWidth * numberOfConsecutiveSquares)}"
      style="fill:${bgColor};stroke:none;stroke-width:0;"/>`;
  }
  const positionToPositionConsecutiveCountPairs = (sortedPositions: number[]): {position: number, count: number}[] =>
    sortedPositions.reduce( (result, position) => {
      if (result.length > 0 && result[result.length-1].position + result[result.length-1].count == position) {
        result[result.length-1].count++;
      } else {
        result.push({position, count: 1});
      }
      return result;
    }, [] as {position: number, count: number}[]
  );
  const whiteBoxRects = [
    ...positionToPositionConsecutiveCountPairs(undoverlineBitPositions({letter, digit, type: "underline"})).map(
      ({position, count}) => renderWhiteBox(position, count, false)),
    ...positionToPositionConsecutiveCountPairs(undoverlineBitPositions({letter, digit, type: "overline"})).map(
      ({position, count}) => renderWhiteBox(position, count, true))
  ].join("");

  return`  <g transform="translate(${round(x)}, ${round(y)})${
    (orientationAsLowercaseLetterTRBL === "?" || orientationAsLowercaseLetterTRBL == "t") ? "" : 
    `rotate(${ FaceOrientationLetterTrbl.toClockwise90DegreeRotationsFromUpright(orientationAsLowercaseLetterTRBL) * 90
    }, ${FaceDimensionsFractional.center}, ${FaceDimensionsFractional.center})`}" id="gelement${letter}${digit}">
  ${ !borderWidth ? "" : `
  <rect
    id="boundary_rectangle_for_face_${letter}${digit}"
    y="0"
    x="0"
    rx="${borderRadius}"
    ry="${borderRadius}"
    height="${FaceDimensionsFractional.size}"
    width="${FaceDimensionsFractional.size}"
    style="fill:${bgColor};${
      borderColor == null ?  "stroke: none;" : (
        "stroke:" + borderColor + ( borderRadius ? `;border-radius: ${borderRadius}px` : '' ) + 
        `;stroke-width:${borderWidth};stroke-miterlimit:4;stroke-dasharray:none;stroke-dashoffset:0;stroke-opacity:1`
  )}"/>`}
  <rect
    id="overline_rectangle_for_face_${letter}${digit}"
    y="${round(FaceDimensionsFractional.overlineTop)}"
    x="${round(FaceDimensionsFractional.undoverlineLeftEdge)}"
    height="${round(FaceDimensionsFractional.undoverlineThickness)}"
    width="${round(FaceDimensionsFractional.undoverlineLength)}"
    style="opacity:1;fill:${printColor};fill-opacity:1;stroke:none;stroke-width:0;"/>
  <rect
    id="underline_rectangle_for_face_${letter}${digit}"
    y="${round(FaceDimensionsFractional.underlineTop)}"
    x="${round(FaceDimensionsFractional.undoverlineLeftEdge)}"
    height="${round(FaceDimensionsFractional.undoverlineThickness)}"
    width="${round(FaceDimensionsFractional.undoverlineLength)}"
    style="opacity:1;fill:${printColor};fill-opacity:1;stroke:none;;stroke-width:0;"/>
  ${whiteBoxRects}
  ${renderFaceTextUpright({letter, digit, linearSizeOfFace, linearSizeOfFacesPrintArea, printColor, bgColor, orientationAsLowercaseLetterTRBL: "?"})}
</g>
`;
};