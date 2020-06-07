import {
  HtmlComponent,
  HtmlComponentConstructorOptions
} from "./web-components/html-component"
import {
  getSecret
} from "./api/post-message-api"
import {
  secretTo10BitWords
} from "./api/secret-to-words"
import { DerivationOptions } from "./api/derivation-options";

const pwmgrAppSecretDerivationOptionsJson =
  `{"type": "Secret", "urlPrefixesAllowed": ["https://pwmgr.app/"]}`;

const passwordFieldId = "password-field" as const;
const getPasswordFromDiceKeyButtonId = "get-password-from-dicekey-button" as const;

export class PasswordManagerSignin extends HtmlComponent {
  private passwordTextElement = document.getElementById(passwordFieldId) as HTMLInputElement;
  private getPasswordFromDiceKeyButton = document.getElementById("get-password-from-dicekey-button") as HTMLButtonElement;

  getPasswordFromDiceKey = async() => {
    try {
      const secret = await getSecret(pwmgrAppSecretDerivationOptionsJson);
      const secretAs13Words = secretTo10BitWords(secret.secretBytes, {wordsNeeded: 13});
      this.passwordTextElement.value = secretAs13Words.join(" ");
      secret.delete();
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
    parentElement: HTMLElement,
    options: HtmlComponentConstructorOptions = {},
  ) {
    super(parentElement, `
    <input id="${passwordFieldId}" type="text" size="60"/>
    <input id="${getPasswordFromDiceKeyButtonId}" type="button" value="Generate password from DiceKey"/>
    `, options);
    this.getPasswordFromDiceKeyButton.addEventListener("click", () => this.getPasswordFromDiceKey() );
  }
};

window.addEventListener("load", () => {
  new PasswordManagerSignin(document.getElementById("password-form-container")!);
});

window.addEventListener("message", (messageEvent) =>
  console.log("window message", messageEvent)
);
