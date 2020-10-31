import style from "./demo.module.css";
import {
  Appendable,
  Attributes,
  Div,
  Span
} from "../../web-component-framework";

type TypeName = "string" | "string[]" | "string | byte[]" | "number"

export const Formula = (result: string, type: TypeName | undefined, ...derivation: Appendable[]): Appendable => Div({class: style.formula},...([
  Span({class: style.formula_left}, result),
  ...(type ? [Span({class: style.formula_type}, type)] : [] ),
  ...(derivation.length === 0 ? [] : [
      Span({class: style.formula_operator}," &xlarr;"),
      Span({class: style.formula_right}, ...derivation)
  ])
]));

export const ParameterCard = (...content: Appendable[]) =>
  Div({class: style.parameter_card}, ...content);

export const ResultLabel = (...content: Appendable[]) =>
  Div({class: style.result_label}, ...content);

export const ResultTextBlock = (options: Attributes<"div">, ...content: Appendable[]) =>
  Div({class: style.result_value, ...options}, ...content);

export const UrlParameter = (name: string, ...value: Appendable[]): Appendable => [
  Span({class: style.url_parameter_name}, name),
  "=",
  Span({class: style.url_parameter_value}, ...value)
]

export const InputVar = (...content: Appendable[]) =>
  Span({class: style.formula_input}, ...content);

export const TemplateString = (...content: Appendable[]): Appendable => [
  Span({class: style.formula_input_braces}, "${"),
  ...content,
  Span({class: style.formula_input_braces}, "}")
];

export const TemplateInputVar = (...content: Appendable[]) =>
    TemplateString(InputVar(...content));

export const FnCallName = (...content: Appendable[]) =>
  Span({class: style.command_in_request_url_formula}, ...content);

export const FnCall = (name: string, ...content: Appendable[]): Appendable => [
      FnCallName(name),
      Span({class: style.formula_input_braces}, "("),
      ...content,
      Span({class: style.formula_input_braces}, ")"),
  ];

export const OperationCard = (title: Appendable, ...content: Appendable[]): Div =>
  Div({class: style.operation_card},
    Div({class: style.operation_card_title}, title),
    ...content
  );

export const UseCaseHeader = (...content: Appendable[]): Div =>
  Div({class: style.use_case_header}, ...content);
