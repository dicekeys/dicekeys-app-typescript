import {
  HtmlComponent,
  HtmlComponentConstructorOptions,
  HtmlComponentOptions
} from "./web-components/html-component"
import {
  getSecret,
  secretTo10BitWords
} from "@dicekeys/dicekeys-api-js"

const pwmgrAppSecretDerivationOptionsJson =
  `{"type": "Secret", "urlPrefixesAllowed": ["https://pwmgr.app/"]}`;

const passwordFieldId = "password-field" as const;
const getPasswordFromDiceKeyButtonId = "get-password-from-dicekey-button" as const;

export class PasswordManagerSignin extends HtmlComponent {
  private passwordTextElement = document.getElementById(passwordFieldId) as HTMLInputElement;
  private getPasswordFromDiceKeyButton = document.getElementById("get-password-from-dicekey-button") as HTMLButtonElement;

  getPasswordFromDiceKey = async() => {
    try {
      const secretFields = await getSecret(pwmgrAppSecretDerivationOptionsJson);
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
  constructor(
    options: HtmlComponentConstructorOptions = {},
  ) {
    super({...options,
      html: `
    <input id="${passwordFieldId}" type="text" size="60"/>
    <input id="${getPasswordFromDiceKeyButtonId}" type="button" value="Generate password from DiceKey"/>
    `});
  }

  attach(options: HtmlComponentOptions = {}) {
    super.attach(options);
    this.getPasswordFromDiceKeyButton.addEventListener("click", () => this.getPasswordFromDiceKey() );
    return this;
  }
};

window.addEventListener("load", () => {
  new PasswordManagerSignin({parentElement: document.getElementById("password-form-container")!}).attach();
});

window.addEventListener("message", (messageEvent) =>
  console.log("window message", messageEvent)
);
