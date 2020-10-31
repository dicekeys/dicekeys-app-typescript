import {
  Appendable,
  Div
} from "~web-component-framework";
import style from "./style-only.module.css";


export const Instructions = (...content: Appendable[]) =>
  Div({class: style.instructions}, ...content);

export const Question = (...content: Appendable[]) =>
  Div({class: style.question}, ...content);
