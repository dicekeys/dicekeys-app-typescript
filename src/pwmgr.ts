import {
  HtmlComponent,
  HtmlComponentConstructorOptions
} from "./web-components/html-component"
import {
  PostMessageApi
} from "./api/post-message-api"

export class PasswordManagerSignin extends HtmlComponent {
  private apiWindow: Window | undefined;

  private api = new PostMessageApi()
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