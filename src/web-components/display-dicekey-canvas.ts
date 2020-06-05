import {
  HtmlComponentConstructorOptions, HtmlComponent
} from "./html-component";
import {
  Face,
  FaceLetters, 
  faceRotationLetterToClockwiseAngle
} from "../dicekeys/face";
import {
  Point
} from "../dicekeys/undoverline"
import {letterIndexTimesSixPlusDigitIndexFaceWithUndoverlineCodes, FaceWithUndoverlineCodes, UndoverlineCodes, getUndoverlineCodes} from "../dicekeys/undoverline-tables";
import {FaceDimensionsFractional} from "../dicekeys/face-dimensions";
import { DiceKey } from "../dicekeys/dicekey";
export const FontFamily = "Inconsolata";
export const FontWeight = "700";

export enum UndoverlineType {
  underline = "underline",
  overline = "overline",
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

const renderFaceForSizes = (sizes: Sizes) => (
  ctx: CanvasRenderingContext2D,
  face: Face,
  center: Point,
): void => {
  const dieLeft = center.x - 0.5 * sizes.linearScaling;
  const dieTop = center.y - 0.5 * sizes.linearScaling;
  const undoverlineLeft = dieLeft + sizes.linearScaling * FaceDimensionsFractional.undoverlineLeftEdge;
  const firstDotLeft = dieLeft + sizes.linearScaling * FaceDimensionsFractional.undoverlineFirstDotLeftEdge ;
  const {underlineCode, overlineCode} = getUndoverlineCodes(face);

  // Draw an underline or overline
  const renderUndoverline = (lineType: "underline" | "overline", code: number): void => {
    const isOverline = lineType == "overline";
      // Calculate the coordinates of the black [und|ov]erline rectangle
      const fractionalTop =  isOverline ?
        FaceDimensionsFractional.overlineTop : FaceDimensionsFractional.underlineTop;
      const top = dieTop + sizes.linearScaling * fractionalTop;

    // Adjust from center top top of face, then add distance from top to face to top of dot box
    const fractionalDotTop =  isOverline ?
      FaceDimensionsFractional.overlineDotTop : FaceDimensionsFractional.underlineDotTop;
    const undoverlineDotTop = dieTop + sizes.linearScaling * fractionalDotTop;
    ctx.fillStyle = "#000000";
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

  // Rotate the canvas in counterclockwise before rendering, so that
  // when the rotation is restored (clockwise) the face will be in the
  // correct direction
  const rotateCanvasBy = faceRotationLetterToClockwiseAngle(face.orientationAsLowercaseLetterTRBL);
  if (rotateCanvasBy !== 0) {
//        ctx.save();
      ctx.translate(+center.x, +center.y);
      ctx.rotate(rotateCanvasBy * Math.PI / 180);
      ctx.translate(-center.x, -center.y);
  }

  // Calculate the positions of the letter and digit
  // Letter is left of center
  const letterX = center.x - sizes.charXOffsetFromCenter;
  // Digit is right of cetner
  const digitX = center.x + sizes.charXOffsetFromCenter;
  const textY = dieTop + FaceDimensionsFractional.textBaselineY * sizes.linearScaling
  // Render the letter and digit
  ctx.fillStyle = "#000000"
  ctx.textAlign = "center";
  const font = `${ FontWeight } ${ sizes.fontSize }px ${ FontFamily }, monospace`;
  ctx.font = font;
  ctx.fillText(face.letter.toString(), letterX, textY)
  ctx.fillText(face.digit.toString(), digitX, textY)
  // Render the underline and overline
  renderUndoverline("underline", underlineCode);
  renderUndoverline("overline", overlineCode);

  // Undo the rotation used to render the face
  if (rotateCanvasBy !== 0) {
//        ctx.restore()
    ctx.translate(+center.x, +center.y);
    ctx.rotate(-rotateCanvasBy * Math.PI / 180);
    ctx.translate(-center.x, -center.y);
  }

}

export const renderDiceKey = (
  ctx: CanvasRenderingContext2D,
  diceKey: DiceKey
): void => {
  const {width, height} = ctx.canvas;
  const linearSize = Math.min(width, height);
  const linearFaceSize = linearSize / 5;
  const centerX = width / 2;
  const centerY = height / 2;
  const sizes = scaleSizes(linearFaceSize, 5/8);
  const renderFace = renderFaceForSizes(sizes);

  diceKey.forEach( (face, index) =>
    renderFace(ctx, face,
      {
        x: centerX + linearFaceSize * (-2 + (index % 5)),
        y: centerY + linearFaceSize * (-2 + Math.floor(index / 5))
      }
  ));
}



/**
 * This class implements the demo page.
 */
export class DisplayDiceKeyCanvas extends HtmlComponent {
  private readonly diceKeyDisplayCanvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    parentElement: HTMLElement,
    options: HtmlComponentConstructorOptions = {},
    private diceKey: DiceKey
  ) {
    super(parentElement, `<canvas id="DiceKeyDisplayCanvas" height="640", width="640">/`, options);

    // Bind to HTML
    this.diceKeyDisplayCanvas = document.getElementById("DiceKeyDisplayCanvas") as HTMLCanvasElement;
    this.ctx = this.diceKeyDisplayCanvas.getContext("2d")!;

    renderDiceKey(this.ctx, this.diceKey);
  }
};
