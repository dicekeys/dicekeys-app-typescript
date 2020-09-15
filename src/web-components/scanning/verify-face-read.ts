import {
  Attributes, Canvas, Component, ComponentEvent, Div, InputButton
} from "../../web-component-framework";
import {
  FaceRead
} from "@dicekeys/read-dicekey-js";


export interface VerifyFaceReadOptions extends Attributes {
  faceRead: FaceRead;
  image: ImageBitmap
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
      Canvas().withElement( canvas => {
        canvas.width = this.options.image.width;
        canvas.height = this.options.image.height;
        this.imageCanvas = canvas;
        canvas.getContext("2d")?.drawImage(this.options.image, 0, 0);
      }),
      Div({},
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