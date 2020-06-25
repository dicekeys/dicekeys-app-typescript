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
  // FaceWithUndoverlineCodes,
  UndoverlineCodes, getUndoverlineCodes
} from "../dicekeys/undoverline-tables";
import {FaceDimensionsFractional} from "../dicekeys/face-dimensions";
import { PartialDiceKey } from "./dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";

export enum UndoverlineType {
  underline = "underline",
  overline = "overline",
}

// HTML5 round rect from
// 
/**
 * Draws a rounded rectangle using the current state of the canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x The top left x coordinate
 * @param {number} y The top left y coordinate
 * @param {number} width The width of the rectangle
 * @param {number} height The height of the rectangle
 * @param {number} radius The corner radius
 * 
 * from: https://stackoverflow.com/questions/1255512/how-to-draw-a-rounded-rectangle-on-html-canvas
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  width: number,
  height: number,
  radius: number,
  fill: boolean = false,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
  if (fill) {
    ctx.fill();
  } else {
    ctx.stroke();
  }
}

const scaleSizes = (linearSizeOfFace: number, linearFractionOfCoverage: number) => {
  const linearScaling = linearSizeOfFace * linearFractionOfCoverage;
  const fractionalXDistFromFaceCenterToCharCenter = (FaceDimensionsFractional.charWidth + FaceDimensionsFractional.spaceBetweenLetterAndDigit) / 2;
  const sizes = {
    linearSizeOfFace,
    linearFractionOfCoverage,
    linearScaling,
    fontSize: FaceDimensionsFractional.fontSize * linearScaling,
    letterSpacing: FaceDimensionsFractional.spaceBetweenLetterAndDigit * linearScaling,
    fractionalXDistFromFaceCenterToCharCenter,
    charXOffsetFromCenter: fractionalXDistFromFaceCenterToCharCenter * linearScaling,
    undoverlineLength: FaceDimensionsFractional.undoverlineLength * linearScaling,
    undoverlineHeight: FaceDimensionsFractional.undoverlineThickness * linearScaling,
    undoverlineDotWidth: FaceDimensionsFractional.undoverlineDotWidth * linearScaling,
    undoverlineDotHeight: FaceDimensionsFractional.undoverlineDotHeight * linearScaling,
  };
  return sizes;
}
type Sizes = ReturnType<typeof scaleSizes>;

export function addUndoverlineCodes<T extends Face>(face: T): T & UndoverlineCodes {
  const letterIndexTimesSixPlusDigitIndex = (FaceLetters.indexOf(face.letter) * 6) + (parseInt(face.digit) -1);
  const {underlineCode, overlineCode} = 
    letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes[letterIndexTimesSixPlusDigitIndex];
  return Object.assign(face, {underlineCode, overlineCode});
}

const textShade = "#000000";
const hiddenTextShade = "#B0B0B0";

const renderFaceForSizes = (sizes: Sizes) => (
  ctx: CanvasRenderingContext2D,
  face: Partial<Face>,
  center: Point
): void => {
  const dieLeft = center.x - 0.5 * sizes.linearScaling;
  const dieTop = center.y - 0.5 * sizes.linearScaling;
  const undoverlineLeft = dieLeft + sizes.linearScaling * FaceDimensionsFractional.undoverlineLeftEdge;
  const firstDotLeft = dieLeft + sizes.linearScaling * FaceDimensionsFractional.undoverlineFirstDotLeftEdge;
  const {letter, digit, orientationAsLowercaseLetterTRBL = "?"} = face;
  const {underlineCode, overlineCode} = (letter != null && digit != null ) ? getUndoverlineCodes({letter, digit}) : {underlineCode: undefined, overlineCode: undefined};

  // Draw an underline or overline
  const renderUndoverline = (lineType: "underline" | "overline", code: number | undefined): void => {
    const isOverline = lineType == "overline";
      // Calculate the coordinates of the black [und|ov]erline rectangle
      const fractionalTop =  isOverline ?
        FaceDimensionsFractional.overlineTop : FaceDimensionsFractional.underlineTop;
      const top = dieTop + sizes.linearScaling * fractionalTop;

    // Adjust from center top top of face, then add distance from top to face to top of dot box
    const fractionalDotTop =  isOverline ?
      FaceDimensionsFractional.overlineDotTop : FaceDimensionsFractional.underlineDotTop;
    const undoverlineDotTop = dieTop + sizes.linearScaling * fractionalDotTop;
    ctx.fillStyle = code != null && orientationAsLowercaseLetterTRBL !== "?" ? textShade : hiddenTextShade;
    ctx.fillRect(undoverlineLeft, top, sizes.undoverlineLength, sizes.undoverlineHeight);

    // Draw the white boxes representing the code in the [und|ov]erline
    // within the [und|ov]erline rectangle.
    ctx.fillStyle = "#FFFFFF";
    if (code != null) {
      const fullCode = 1024 + (isOverline ? 512 : 0) + (code << 1);
      for (var pos=0; pos <= 10; pos++) {
        if (((fullCode >> (10 - pos)) & 1) != 0) {
          // Draw a white box at position pos because that bit is 1 in the code
          const undoverlineDotLeft = firstDotLeft + sizes.undoverlineDotWidth * pos;
          ctx.fillRect(undoverlineDotLeft, undoverlineDotTop, sizes.undoverlineDotWidth, sizes.undoverlineDotHeight)
        }
      }
    }
  }

  // Draw the outline rectangle
  ctx.strokeStyle = "#000000";
  const sizeFromEdgeToEdge = sizes.linearSizeOfFace * 0.8;
  roundRect(
    ctx,
    center.x - 0.5 * sizeFromEdgeToEdge, center.y - 0.5 * sizeFromEdgeToEdge,
    sizeFromEdgeToEdge, sizeFromEdgeToEdge,
    sizeFromEdgeToEdge / 6
  );

  // Rotate the canvas in counterclockwise before rendering, so that
  // when the rotation is restored (clockwise) the face will be in the
  // correct direction
  const rotateCanvasBy = faceRotationLetterToClockwiseAngle(orientationAsLowercaseLetterTRBL);
  if (rotateCanvasBy !== 0) {
//        ctx.save();
      ctx.translate(+center.x, +center.y);
      ctx.rotate(rotateCanvasBy * Math.PI / 180);
      ctx.translate(-center.x, -center.y);
  }

  // Render the underline and overline
  renderUndoverline("underline", underlineCode);
  renderUndoverline("overline", overlineCode);

  // Calculate the positions of the letter and digit
  // Letter is left of center
  const letterX = center.x - sizes.charXOffsetFromCenter;
  // Digit is right of cetner
  const digitX = center.x + sizes.charXOffsetFromCenter;
  const textY = dieTop + FaceDimensionsFractional.textBaselineY * sizes.linearScaling
  // Render the letter and digit
  ctx.textAlign = "center";
  const font = `${ FontWeight } ${ sizes.fontSize }px ${ FontFamily }, monospace`;
  ctx.font = font;
  ctx.fillStyle = letter != null ? textShade : hiddenTextShade;
  ctx.fillText(letter != null ? letter.toString() : "Q", letterX, textY);
  ctx.fillStyle = digit != null ? textShade : hiddenTextShade;
  ctx.fillText(digit != null ? digit.toString() : "0", digitX, textY);
  
  // Undo the rotation used to render the face
  if (rotateCanvasBy !== 0) {
//        ctx.restore()
    ctx.translate(+center.x, +center.y);
    ctx.rotate(-rotateCanvasBy * Math.PI / 180);
    ctx.translate(-center.x, -center.y);
  }
}

export const renderFaceFactory = (
  linearSizeOfFace: number,
  linearFractionOfCoverage: number = 5/8
) => renderFaceForSizes(
  scaleSizes(linearSizeOfFace, linearFractionOfCoverage)
);


export const renderDiceKey = (
  ctx: CanvasRenderingContext2D,
  diceKey: PartialDiceKey,
): void => {
  const {width, height} = ctx.canvas;
  const linearSize = Math.min(width, height);
  const linearFaceSize = linearSize / 5;
  const centerX = width / 2;
  const centerY = height / 2;
  const renderFace = renderFaceFactory(linearFaceSize);

  ctx.clearRect(0, 0, width, height);

  diceKey.forEach( (face, index) => {
    // if obscuring, show only the top left and bottom right dice in canonical form.
    renderFace(ctx, face,
      {
        x: centerX + linearFaceSize * (-2 + (index % 5)),
        y: centerY + linearFaceSize * (-2 + Math.floor(index / 5)),
      }
    );
  });
}