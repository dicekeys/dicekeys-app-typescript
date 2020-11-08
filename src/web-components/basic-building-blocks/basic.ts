import style from "./basic.module.css";
import {
  Appendable,
  Div,
  Label
} from "~web-component-framework";


export const FormCard = (...appendable: Appendable[]) =>
  Div({class: style.form_card}, ...appendable);

export const InputCard = (...appendable: Appendable[]) =>
  Div({class: style.input_card}, ...appendable);

export const LabelAboveLeft = (...appendable: Appendable[]) =>
  Label({class: style.label_above_left}, ...appendable);

export const CenteredControls = (...appendable: Appendable[]) =>
  Div({class: style.centered_controls}, ...appendable);