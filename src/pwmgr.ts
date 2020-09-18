import {
  Component,
} from "./web-component-framework"
import {
  DerivationOptions,
  getPassword
} from "@dicekeys/dicekeys-api-js"

const pwmgrAppSecretDerivationOptionsJson = JSON.stringify(DerivationOptions({
  type: "Secret",
  mutable: true,
  excludeOrientationOfFaces: true,
  wordLimit: 15,
  allow: [{"host": "pwmgr.app"}]
}));

const passwordFieldId = "password-field" as const;
const getPasswordFromDiceKeyButtonId = "get-password-from-dicekey-button" as const;

export class PasswordManagerSignIn extends Component {
  private get passwordTextElement(): HTMLInputElement {
    return document.getElementById(passwordFieldId) as HTMLInputElement;
  }
  private get getPasswordFromDiceKeyButton() {
    return document.getElementById("get-password-from-dicekey-button") as HTMLButtonElement;
  }

  getPasswordFromDiceKey = async() => {
    try {
      const {password} = await getPassword({derivationOptionsJson: pwmgrAppSecretDerivationOptionsJson});
      this.passwordTextElement.value = password;
      // const secret = (await SeededCryptoModulePromise).Secret.fromJsObject(secretFields);
      // secret.delete();
    } catch (e) {
      alert(`Could not use your DiceKey to generate your password: ${e.message}`)
    }
  }

  /**
   * The code supporting the demo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor() {
    super({}, document.getElementById("password-form-container")!);
  }

  render() {
    this.appendHtml(`
      <div style="display: flex; width: fit-content; align-self: center; align-items: flex-start;">
        <input id="${passwordFieldId}" type="text" size="60"/>
        <input id="${getPasswordFromDiceKeyButtonId}" type="button" value="Generate password from DiceKey"/>
      </div>
    `);

    this.getPasswordFromDiceKeyButton.addEventListener("click", () => this.getPasswordFromDiceKey() );

  }
};

window.addEventListener("load", () => {
  new PasswordManagerSignIn();
});

window.addEventListener("message", (messageEvent) =>
  console.log("window message", messageEvent)
);
