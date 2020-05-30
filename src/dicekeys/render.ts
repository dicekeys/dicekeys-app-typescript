// import {round} from "./round";
import {
  Face,
  FaceLetters, 
  faceRotationLetterToClockwiseAngle
} from "./face";
import {
  Point
} from "./undoverline"
import {letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes, FaceWithUndoverlineCodes, UndoverlineCodes, getUndoverlineCodes} from "./undoverline-tables";
import {FaceDimensionsFractional} from "./face-dimensions";
import { DiceKey } from "./dicekey";
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


export const renderDiceKey = (
  ctx: CanvasRenderingContext2D,
  diceKey: DiceKey
): void => {
  const {width, height} = ctx.canvas;
  const linearSize = Math.min(width, height);
  const linearFaceSize = linearSize / 5;
  const centerX = width / 2;
  const centerY = width / 2;

  const rc = new DiceKeyRenderContext(ctx, linearFaceSize, 5/8);

  diceKey.forEach( (face, index) =>
    rc.renderFace(face,
      {
        x: centerX + linearFaceSize * (-2 + (index % 5)),
        y: centerY + linearFaceSize * (-2 + Math.floor(index / 5))
      }
  ));
}

export class DiceKeyRenderContext {
  constructor(
    protected ctx: CanvasRenderingContext2D,
    protected linearSizeOfFace: number,
    protected linearFractionOfCoverage: number
  ) {}

  protected readonly linearScaling = this.linearSizeOfFace * this.linearFractionOfCoverage;
  protected readonly fontSize = FaceDimensionsFractional.fontSize * this.linearScaling;
  protected readonly letterSpacing = FaceDimensionsFractional.spaceBetweenLetterAndDigit * this.linearScaling;
  protected readonly fractionalXDistFromFaceCenterToCharCenter = (FaceDimensionsFractional.charWidth + FaceDimensionsFractional.spaceBetweenLetterAndDigit) / 2
  protected readonly charXOffsetFromCenter = this.fractionalXDistFromFaceCenterToCharCenter * this.linearScaling;
  private readonly undoverlineLength = FaceDimensionsFractional.undoverlineLength * this.linearScaling;
  private readonly undoverlineHeight = FaceDimensionsFractional.undoverlineThickness * this.linearScaling;
  private readonly undoverlineDotWidth = FaceDimensionsFractional.undoverlineDotWidth * this.linearScaling;
  private readonly undoverlineDotHeight = FaceDimensionsFractional.undoverlineDotHeight * this.linearScaling;

  renderFace = (
    face: Face,
    center: Point
  ): void => {
    const dieLeft = center.x - 0.5 * this.linearScaling;
    const dieTop = center.y - 0.5 * this.linearScaling;
    const undoverlineLeft = dieLeft + this.linearScaling * FaceDimensionsFractional.undoverlineLeftEdge;
    const undoverlineRight = undoverlineLeft + this.linearScaling * FaceDimensionsFractional.undoverlineLength;
    const firstDotLeft = dieLeft + this.linearScaling * FaceDimensionsFractional.undoverlineFirstDotLeftEdge ;
    const {underlineCode, overlineCode} = getUndoverlineCodes(face);

    // Draw an underline or overline
    const renderUndoverline = (lineType: "underline" | "overline", code: number): void => {
      const isOverline = lineType == "overline";
        // Calculate the coordinates of the black [und|ov]erline rectangle
        const fractionalTop =  isOverline ?
          FaceDimensionsFractional.overlineTop : FaceDimensionsFractional.underlineTop;
        const top = dieTop + this.linearScaling * fractionalTop;

      // Adjust from center top top of face, then add distance from top to face to top of dot box
      const fractionalDotTop =  isOverline ?
        FaceDimensionsFractional.overlineDotTop : FaceDimensionsFractional.underlineDotTop;
      const undoverlineDotTop = dieTop + this.linearScaling * fractionalDotTop;
//      const bottom = top + FaceDimensionsFractional.undoverlineThickness * this.linearScaling
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(undoverlineLeft, top, this.undoverlineLength, this.undoverlineHeight);

      // Draw the white boxes representing the code in the [und|ov]erline
      // within the [und|ov]erline rectangle.
      this.ctx.fillStyle = "#FFFFFF";
      if (code != null) {
        const fullCode = 1024 + (isOverline ? 512 : 0) + (code << 1);
        for (var pos=0; pos <= 10; pos++) {
          if (((fullCode >> (10 - pos)) & 1) != 0) {
            // Draw a white box at position pos because that bit is 1 in the code
            const undoverlineDotLeft = firstDotLeft + this.undoverlineDotWidth * pos;
            this.ctx.fillRect(undoverlineDotLeft, undoverlineDotTop, this.undoverlineDotWidth, this.undoverlineDotHeight)
          }
        }
      }
    }

    // Rotate the canvas in counterclockwise before rendering, so that
    // when the rotation is restored (clockwise) the face will be in the
    // correct direction
    const rotateCanvasBy = faceRotationLetterToClockwiseAngle(face.orientationAsLowercaseLetterTRBL);
    if (rotateCanvasBy !== 0) {
//        this.ctx.save();
        this.ctx.translate(+center.x, +center.y);
        this.ctx.rotate(rotateCanvasBy * Math.PI / 180);
        this.ctx.translate(-center.x, -center.y);
    }

    // Calculate the positions of the letter and digit
    // Letter is left of center
    const letterX = center.x - this.charXOffsetFromCenter;
    // Digit is right of cetner
    const digitX = center.x + this.charXOffsetFromCenter;
    const textY = dieTop + FaceDimensionsFractional.textBaselineY * this.linearScaling
    // Render the letter and digit
    this.ctx.fillStyle = "#000000"
    this.ctx.textAlign = "center";
    const font = `${ FaceDimensionsFractional.fontSize * this.linearScaling }px 700 Inconsolata`;
    this.ctx.font = font;
    this.ctx.fillText(face.letter.toString(), letterX, textY)
    this.ctx.fillText(face.digit.toString(), digitX, textY)
    // Render the underline and overline
    renderUndoverline("underline", underlineCode);
    renderUndoverline("overline", overlineCode);

    // Undo the rotation used to render the face
    if (rotateCanvasBy !== 0) {
//        this.ctx.restore()
      this.ctx.translate(+center.x, +center.y);
      this.ctx.rotate(-rotateCanvasBy * Math.PI / 180);
      this.ctx.translate(-center.x, -center.y);
    }

  }
    

}