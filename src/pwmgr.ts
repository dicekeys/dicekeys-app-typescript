import {
  HtmlComponent,
} from "./web-components/html-component"
import {
  getSecret,
  secretTo10BitWords,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js"

const pwmgrAppSecretDerivationOptionsJson = JSON.stringify(DerivationOptions({
  type: "Secret",
  mutable: true,
  excludeOrientationOfFaces: true,
  allow: [{"host": "pwmgr.app"}]
}));

const passwordFieldId = "password-field" as const;
const getPasswordFromDiceKeyButtonId = "get-password-from-dicekey-button" as const;

export class PasswordManagerSignin extends HtmlComponent {
  private get passwordTextElement(): HTMLInputElement {
    return document.getElementById(passwordFieldId) as HTMLInputElement;
  }
  private get getPasswordFromDiceKeyButton() {
    return document.getElementById("get-password-from-dicekey-button") as HTMLButtonElement;
  }

  getPasswordFromDiceKey = async() => {
    try {
      const secretFields = await getSecret({derivationOptionsJson: pwmgrAppSecretDerivationOptionsJson});
      const secretAs13Words = secretTo10BitWords(secretFields.secretBytes, {wordsNeeded: 13});
      this.passwordTextElement.value = secretAs13Words.join(" ");
      // const secret = (await SeededCryptoModulePromise).Secret.fromJsObject(secretFields);
      // secret.delete();
    } catch (e) {
      alert(`Could not use your DiceKey to generate your password: ${e.message}`)
    }
  }

  /**
   * The code supporting the dmeo page cannot until the WebAssembly module for the image
   * processor has been loaded. Pass the module to wire up the page with this class.
   * @param module The web assembly module that implements the DiceKey image processing.
   */
  constructor() {
    super({}, document.getElementById("password-form-container")!);
    this.appendHtml(`
      <input id="${passwordFieldId}" type="text" size="60"/>
      <input id="${getPasswordFromDiceKeyButtonId}" type="button" value="Generate password from DiceKey"/>
    `);

    this.getPasswordFromDiceKeyButton.addEventListener("click", () => this.getPasswordFromDiceKey() );
  }
};

window.addEventListener("load", () => {
  new PasswordManagerSignin();
});

window.addEventListener("message", (messageEvent) =>
  console.log("window message", messageEvent)
);
