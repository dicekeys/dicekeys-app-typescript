import {
  Attributes, Canvas, Component, ComponentEvent, Div, InputButton
} from "../../web-component-framework";
import {
  FaceRead
} from "@dicekeys/read-dicekey-js";
import { CenteredControls } from "~web-components/basic-building-blocks";


export interface VerifyFaceReadOptions extends Attributes {
  faceRead: FaceRead;
  image: {width: number, height: number, data: Uint8ClampedArray}
}

export class VerifyFaceRead extends Component<VerifyFaceReadOptions>  {
  imageCanvas: HTMLCanvasElement | undefined;

  constructor(options: VerifyFaceReadOptions) {
    super(options);
  }

  public userConfirmedOrDenied = new ComponentEvent<["confirmed" | "denied"]>(this);

  render() {
    const {letter, digit} = this.options.faceRead
    this.append(
      Div({style: "color: white; font-size: 2rem;"}, "Is this die a " + letter + digit + "?"),
      Canvas({style: "width: 40rem; height: 40rem;"}).withElement( canvas => {
        const {width, height} = this.options.image;
        canvas.width = width;
        canvas.height = height;
        this.imageCanvas = canvas;
        const imageData = new ImageData(width, height);
        imageData.data.set(this.options.image.data);
        canvas.getContext("2d")?.putImageData(imageData, 0, 0);
      }),
      CenteredControls(
        InputButton({value: "No"}).with( b => b.events.click.on( () => {
          this.options.faceRead.userValidationOutcome = "user-rejected";
          this.userConfirmedOrDenied.send("denied") 
        } ) ),
        InputButton({value: "Yes"}).with( b => b.events.click.on( () => {
          this.options.faceRead.userValidationOutcome = "user-confirmed";
          this.userConfirmedOrDenied.send("confirmed");
        } ) ),
      )
    );
  }

}