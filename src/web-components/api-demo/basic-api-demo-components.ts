import style from "./demo.module.css";
import {
  Appendable,
  Attributes,
  Div,
  Span
} from "../../web-component-framework";

export const FormulaInputVariable = Span.with( e => e.primaryElement.classList.add(style.formula_input) );

type TypeName = "string" | "string[]" | "string | byte[]"

export const Formula = (result: string, type: TypeName | undefined, ...derivation: Appendable[]): Appendable => Div({class: style.formula},...([
  Span({class: style.formula_left}, result),
  ...(type ? [Span({class: style.formula_type}, type)] : [] ),
  Span({class: style.formula_operator}," &larr; "),
  Span({class: style.formula_right}, ...derivation)
]));

export const ParameterCard = (options: Attributes<"div">, ...content: Appendable[]) =>
  Div({class: style.parameter_card, ...options}, ...content);

export const ResultTextBlock = (options: Attributes<"div">, ...content: Appendable[]) =>
Div({class: style.result_value, ...options}, ...content);

export const Instructions = (...content: Appendable[]) =>
  Div({class: style.instructions}, ...content);

export const FnCall = (...content: Appendable[]) =>
  Span({class: style.command_in_request_url_formula}, ...content);