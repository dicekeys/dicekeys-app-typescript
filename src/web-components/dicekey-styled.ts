
import styles from "./dicekey-styled.module.css";

import {
  Span,
  Attributes
} from "../web-component-framework";
import { Component } from "~web-component-framework";

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

export const DICEKEY = () => new StyledLogo("DICE", "KEY");
export const DICEKEYS = () => new StyledLogo("DICE", "KEYS");
export const STICKEY = () => new StyledLogo("STIC", "KEY");
export const STICKEYS = () => new StyledLogo("STIC", "KEYS");