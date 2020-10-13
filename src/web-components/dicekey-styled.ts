
import styles from "./dicekey-styled.module.css";

import {
  Span,
  Attributes
} from "../web-component-framework";
import { Component } from "../web-component-framework";

class StyledLogo extends Component<Attributes> {
  constructor(
    private readonly firstHalfText: string,
    private readonly secondHalfText: string,
    options: Attributes = {}
  ) {
    super(options, document.createElement("span"));
  }

  render() {
    super.render();
    this.append(
      Span({class: styles.dice_style, text: this.firstHalfText}),
      Span({class: styles.keys_style, text: this.secondHalfText}),
    )
  }
}

export const DICEKEY = () => new StyledLogo("Dice", "Key");
export const DICEKEYS = () => new StyledLogo("Dice", "Keys");
export const STICKEY = () => new StyledLogo("Stic", "Key");
export const STICKEYS = () => new StyledLogo("Stic", "Keys");