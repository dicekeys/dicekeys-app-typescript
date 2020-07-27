import * as SVG from "./svg";
import {
  Face,
  FaceLetters, 
  faceRotationLetterToClockwiseAngle
} from "../dicekeys/face";
import {
  Point
} from "../dicekeys/undoverline"
import {
  letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes,
  UndoverlineCodes, getUndoverlineCodes
} from "../dicekeys/undoverline-tables";
import {FaceDimensionsFractional} from "../dicekeys/face-dimensions";
import { PartialDiceKey, DiceKey } from "./dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";

export enum UndoverlineType {
  underline = "underline",
  overline = "overline",
}

export function addUndoverlineCodes<T extends Face>(face: T): T & UndoverlineCodes {
  const letterIndexTimesSixPlusDigitIndex = (FaceLetters.indexOf(face.letter) * 6) + (parseInt(face.digit) -1);
  const {underlineCode, overlineCode} = 
    letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[letterIndexTimesSixPlusDigitIndex];
  return Object.assign(face, {underlineCode, overlineCode});
}

const textShade = "#000000";
const hiddenTextShade = "#B0B0B0";
const dieSurfaceColor = "#ffffff";
const diceBoxColor = "#000030"

export interface DiceKeyRenderOptions {
  hide21?: boolean,
  diceBoxColor?: [number, number, number],
  showLidTab?: boolean,
}

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
const renderUnitFace = (
  face: Partial<Face>,
): SVGElement[] => {
  const renderedElements = [] as SVGElement[];

  const undoverlineLeft = -FaceDimensionsFractional.undoverlineLength / 2;
  const firstDotLeft = -(FaceDimensionsFractional.undoverlineDotWidth * 11)/2;
  const {letter, digit} = face;
  const {underlineCode, overlineCode} = (letter != null && digit != null ) ? getUndoverlineCodes({letter, digit}) : {underlineCode: undefined, overlineCode: undefined};

  // Draw an underline or overline
  const renderUndoverline = (lineType: "underline" | "overline", code: number | undefined): void => {
    const isOverline = lineType == "overline";
      // Calculate the coordinates of the black [und|ov]erline rectangle
      const lineTop = -0.5 + (isOverline ?
        FaceDimensionsFractional.overlineTop : FaceDimensionsFractional.underlineTop
      );

    // Adjust from center top top of face, then add distance from top to face to top of dot box
    const undoverlineDotTop = -0.5 + (isOverline ?
      FaceDimensionsFractional.overlineDotTop : FaceDimensionsFractional.underlineDotTop
    );
    renderedElements.push(
      SVG.rect({
        x: undoverlineLeft,
        y: lineTop,
        height: FaceDimensionsFractional.undoverlineThickness,
        width: FaceDimensionsFractional.undoverlineLength,
        style: `fill: ${ code != null ? textShade : hiddenTextShade}; stroke: none;`
      })
    )

    // Draw the white boxes representing the code in the [und|ov]erline
    // within the [und|ov]erline rectangle.
    if (code != null) {
      const fullCode = 1024 + (isOverline ? 512 : 0) + (code << 1);
      for (var pos=0; pos <= 10; pos++) {
        if (((fullCode >> (10 - pos)) & 1) != 0) {
          // Draw a white box at position pos because that bit is 1 in the code
          const undoverlineDotLeft = firstDotLeft + FaceDimensionsFractional.undoverlineDotWidth * pos;
          renderedElements.push(SVG.rect({
            x: undoverlineDotLeft,
            y: undoverlineDotTop,
            width: FaceDimensionsFractional.undoverlineDotWidth,
            height: FaceDimensionsFractional.undoverlineDotHeight,
            style: `fill: ${dieSurfaceColor};`
          }));
        }
      }
    }
  }
  // Render the underline and overline
  renderUndoverline("underline", underlineCode);
  renderUndoverline("overline", overlineCode);

  renderedElements.push(SVG.text({
      x: 0,
      y: -0.5 + FaceDimensionsFractional.textBaselineY,
      style: `font-family: ${FontFamily}; fill:${textShade};font-size:${FaceDimensionsFractional.fontSize}px;font-weight:${FontWeight};letter-spacing:${FaceDimensionsFractional.spaceBetweenLetterAndDigit}px;text-anchor:middle;text-align:center;line-height:1;fill-opacity:1;`,
    },
    SVG.tspan(`${letter || ' '}${digit || ' '}`)
  ));
  return renderedElements;
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
export const renderFace = (
  face: Partial<Face>,
  center: Point = {x: 0, y: 0},
  linearFractionOfCoverage: number = 5/8,
): SVGElement =>  {
  const radius = 1 / 12;
  const clockwiseAngle = faceRotationLetterToClockwiseAngle(face.orientationAsLowercaseLetterTRBL || "?");
  return SVG.g({
      transform: `translate(${center.x}, ${center.y})`,
    },
    SVG.rect({
      x: -0.5, y: -0.5,
      width: 1, height: 1,
      rx: radius, ry: radius,
      style: `fill: ${dieSurfaceColor};` // `stroke: ${textShade}`
    }),
    SVG.g({
        transform: `scale(${linearFractionOfCoverage})${
            clockwiseAngle === 0 ? "" : ` rotate(${ clockwiseAngle }, 0, 0)`
          }`
      },
      ...renderUnitFace(face)
    )
  );

}

/**
 * Render a DiceKey into an SVG element.
 * 
 * @param svgElement
 * @param diceKey 
 * @param options 
 */
export const renderDiceKey = (
  svgElement: SVGSVGElement,
  diceKey: PartialDiceKey,
  options: DiceKeyRenderOptions = {}
): void => {
  const {
    hide21,
    showLidTab = true
  } = options;
  // The linear length of the box dedicated to the tab;
  const tabFraction = 0.1;

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

  // Clear the SVG Element
  while (svgElement.lastChild) {
    svgElement.removeChild(svgElement.lastChild);
  }

  // new SVG element, viewbox = ...
  const top = -linearSizeOfBox / 2;
  const left = -linearSizeOfBox / 2;
  const radius = linearSizeOfBox / 50;
  svgElement.setAttribute("viewBox", `${left} ${top} ${linearSizeOfBox} ${linearSizeOfBoxWithTab}`);
  
  // const marginOfBoxEdgeAsFractionOfLinearSize = 0.03;
  // const linearSizeOfInnerBox = 1 - 2 * marginOfBoxEdgeAsFractionOfLinearSize;
  // const linearFaceSize = linearSizeOfBox * linearSizeOfInnerBox / 5;
  // const renderFace = renderFaceFactory(linearFaceSize);

  if (showLidTab) {
    svgElement.appendChild(
      SVG.circle({
       cx: 0, cy: top + linearSizeOfBox, r: tabFraction * linearSizeOfBox,
       style: `fill: ${diceBoxColor}`
      }));
  }

  // Render the blue dice box
  svgElement.appendChild(
    SVG.rect({
      x: left, y: top,
      width: linearSizeOfBox, height: linearSizeOfBox,
      rx: radius, ry: radius,
      style: `fill: ${diceBoxColor}`
    })
  )
  var [r, g, b] = [1, 3, 5].map( start => parseInt( diceBoxColor.substr(start, 2), 16) );
  const diceBoxColorRGB = {r, g, b};

  diceKey.forEach( (face, index) => {
    // if obscuring, show only the top left and bottom right dice in canonical form.
    const x = distanceBetweenDieCenters * (-2 + (index % 5));
    const y = distanceBetweenDieCenters * (-2 + Math.floor(index / 5));
    const isCornerDie = DiceKey.cornerIndexeSet.has(index);
    svgElement.appendChild(renderFace(hide21 && !isCornerDie ? {} : face, {x, y}));
    if (hide21) {
      svgElement.appendChild(SVG.rect({
        x: x - distanceBetweenDieCenters/2,
        y: y - distanceBetweenDieCenters/2,
        height: distanceBetweenDieCenters, width: distanceBetweenDieCenters,
        rx: distanceBetweenDieCenters/12, ry: distanceBetweenDieCenters/12,
        style: `fill: rgba(${diceBoxColorRGB.r},${diceBoxColorRGB.g},${diceBoxColorRGB.b},${ isCornerDie ? 0.8 : 0.97 })`
      }));
    }
  });
}