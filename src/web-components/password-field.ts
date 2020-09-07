import styles from "./password-field.module.css"
import {
  Attributes,
  Component} from "../web-component-framework";
import { 
  Div,
  Observable,
} from "../web-component-framework";
// import {
//   DiceKeyAppState
// } from "../state";

const obscuringCharacter = String.fromCharCode(0x25A0); // * ■▓▒░
const obscurePassword = (password: string): string => {
  const words = password.split(' ');
  const obscuredWords = words.map( word => word.split("").map( _ => obscuringCharacter).join("")); // * ▓▒░
  const sortedObscuredWords = obscuredWords.sort();
  return sortedObscuredWords.join(' ');
}

// We recommend you never write down your DiceKey (there are better ways to copy it)
// or read it over the phone (which you should never be asked to do), but if you
// had a legitimate reason to, removing orientations make it easier and more reliable.

// By removing orientations from your DiceKey before generating a ___,
// your DiceKey will be more than a quadrillion
// (one million billion) times easier to guess, but the number of possible
// values will still be ... 

// This hint makes your DiceKey 303,600 easier to guess.  However, the number of possible
// guesses is still greater than ... .
// The hint does make it possible for others to know that you used the same  DiceKey for multiple
// accounts.

export interface DisplayPasswordOptions extends Attributes {
  password: Observable<string>
  obscurePassword?: Observable<boolean>;
  showCopyIcon?: boolean;
}

export class DisplayPassword extends Component<DisplayPasswordOptions> {

  obscurePassword: Observable<boolean>;

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor(
    options: DisplayPasswordOptions
  ) {
      super(options);
      this.addClass(styles.password_to_be_shared_container);
      this.obscurePassword = options.obscurePassword ?? new Observable<boolean>(true);
      this.obscurePassword?.observe( () => this.update() );
      this.options.password?.observe( () => this.update() );
  }

  passwordField?: HTMLDivElement;

  update = () => {
    if (this.passwordField) {
    const password = this.options.password.value ?? "";
      this.passwordField.innerText = this.obscurePassword.value ? obscurePassword(password) : password;
    }
  }

  render() {
    super.render();
    this.append(
      this.options.showCopyIcon ?
        Div({
          // text: `📋`,
          style: `position: relative; font-size: 1.1rem; width: 0px; top: -.15rem; left: -1.85rem; user-select: none; cursor: pointer;`}
        ).appendHtml("&#128203;").with( copyButton =>
          copyButton.events.click.on( () => {
            navigator.clipboard.writeText(this.options.password.value ?? "");
            // FUTURE - provide user notification that copy happened.
          })
        ) :        
        undefined
      ,
      Div({class: "password-to-be-shared", text: this.options.password.value ?? ""}).withElement( (e) => {
        this.passwordField = e;
        e.addEventListener("click", () => { this.obscurePassword.value = ! this.obscurePassword.value } );
      }),
      Div({style: `position: relative; font-size: 1.25rem; width: 0px; top: -.25rem; right: -.75rem; user-select: none; cursor: pointer;`}, '&#x1F441;' // 👁, but packagers have problem with unicode
      ).withElement( e => {
        e.addEventListener("click", () => { this.obscurePassword.value = ! this.obscurePassword.value } );
        this.obscurePassword.observe( obscure => e.style.setProperty("text-decoration", obscure ? "" : "line-through" ));
      })
    );
  }

}
