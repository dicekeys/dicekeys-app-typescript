import {
  HtmlComponent,
  HtmlComponentConstructorOptions
} from "./web-components/html-component"
import {
  DiceKeysPostMessageApi
} from "./api/post-message-api"
import { DerivationOptions } from "./api/derivation-options";

const pwmgrAppSecretDerivationOptionsJson = `{
  "type": "secret",
  "urlPrefixesAllowed": ["https://pwmgr.app/"]
}`;

export class PasswordManagerSignin extends HtmlComponent {
  private apiWindow: Window | undefined;

  private api = new DiceKeysPostMessageApi()

  getPassword = async() => {
    const secret = await this.api.getSecret(pwmgrAppSecretDerivationOptionsJson);
    const {secretBytes} = secret;
    secret.delete();

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
    
    /`, options);

  }
};