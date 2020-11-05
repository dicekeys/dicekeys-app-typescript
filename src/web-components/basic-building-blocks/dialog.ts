import { Appendable, Div } from "~web-component-framework";
import style from "./dialog.module.css";

export const CenteredControls = (...appendable: Appendable[]) =>
  Div({class: style.centered_controls}, ...appendable);