import { Appendable, Div } from "../../web-component-framework";
import style from "./overlay.module.css";

export const Overlay = (...appendable: Appendable[]) =>
  Div({class: style.overlay}, ...appendable);