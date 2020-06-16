import {
  HtmlComponentConstructorOptions, HtmlComponent, ComponentEvent
} from "./html-component";
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
import { DiceKey } from "../dicekeys/dicekey";
import {
  DiceKeyAppState
} from "../state/app-state-dicekey";
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

const renderFaceForSizes = (sizes: Sizes) => (
  ctx: CanvasRenderingContext2D,
  face: Face,
  center: Point,
  obscure: boolean = false
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

    if (obscure) {
      // Don't actually display data.
      return;
    }
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
  const rotateCanvasBy = faceRotationLetterToClockwiseAngle(face.orientationAsLowercaseLetterTRBL);
  if (!obscure && rotateCanvasBy !== 0) {
//        ctx.save();
      ctx.translate(+center.x, +center.y);
      ctx.rotate(rotateCanvasBy * Math.PI / 180);
      ctx.translate(-center.x, -center.y);
  }

  // Render the underline and overline
  renderUndoverline("underline", underlineCode);
  renderUndoverline("overline", overlineCode);


  if (obscure) {
    return;
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
  diceKey: DiceKey,
  obscure: boolean = false
): void => {
  const {width, height} = ctx.canvas;
  const linearSize = Math.min(width, height);
  const linearFaceSize = linearSize / 5;
  const centerX = width / 2;
  const centerY = height / 2;
  const sizes = scaleSizes(linearFaceSize, 5/8);
  const renderFace = renderFaceForSizes(sizes);

  const canonicalDiceKey = DiceKey.rotateToRotationIndependentForm(diceKey);


  diceKey.forEach( (face, index) => {
    // if obscuring, show only the top left and bottom right dice in canonical form.
    const obscureThisDie = obscure &&
      (face.letter !== canonicalDiceKey[0].letter || face.digit !== canonicalDiceKey[0].digit ) &&
      (face.letter !== canonicalDiceKey[24].letter || face.digit !== canonicalDiceKey[24].digit );
    renderFace(ctx, face,
      {
        x: centerX + linearFaceSize * (-2 + (index % 5)),
        y: centerY + linearFaceSize * (-2 + Math.floor(index / 5)),
      },
      obscureThisDie
    );
  });
}

interface DisplayDiceKeyCanvasOptions extends HtmlComponentConstructorOptions {
  obscure?: boolean
}

/**
 * This class implements the component that displays DiceKeys.
 */
export class DisplayDiceKeyCanvas extends HtmlComponent<DisplayDiceKeyCanvasOptions> {
  private static readonly forgetDiceKeyButtonId = "forget-dicekey-button";
  private forgetDiceKeyButton?: HTMLButtonElement;
  private static diceKeyDisplayCanvasId = "dicekey-display-canvas";
  private diceKeyDisplayCanvas?: HTMLCanvasElement;
  private ctx?: CanvasRenderingContext2D;


  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DisplayDiceKeyCanvasOptions = {},
    private diceKey: DiceKey
  ) {
    super({...options,
      html: `
      <canvas id="${DisplayDiceKeyCanvas.diceKeyDisplayCanvasId}" height="640", width="640"></canvas>
      <input id="${DisplayDiceKeyCanvas.forgetDiceKeyButtonId}" type="button" value="Forget Dicekey"/>
    `});
  }

  attach(
    options: Partial<DisplayDiceKeyCanvasOptions> = {},
  ) {
    super.attach(options);
    // Bind to HTML
    this.forgetDiceKeyButton = document.getElementById(DisplayDiceKeyCanvas.forgetDiceKeyButtonId) as HTMLButtonElement;
    this.diceKeyDisplayCanvas = document.getElementById(DisplayDiceKeyCanvas.diceKeyDisplayCanvasId) as HTMLCanvasElement;
    this.ctx = this.diceKeyDisplayCanvas.getContext("2d")!;
    this.ctx.clearRect(0, 0, this.diceKeyDisplayCanvas.width, this.diceKeyDisplayCanvas.height);

    renderDiceKey(this.ctx, this.diceKey, options.obscure);
  
    this.forgetDiceKeyButton.addEventListener("click", () => {
      DiceKeyAppState.instance?.eraseDiceKey();
      this.forgetEvent.send();
      this.detach();
    });
    return this;
  }

  public forgetEvent = new ComponentEvent(this);

};
