import demoStyles from "./demo.module.css";
import {
  Appendable,
  Span
} from "../../web-component-framework";

export const FormulaInputVariable = Span.with( e => e.primaryElement.classList.add(demoStyles.formula_input) );
export const FormulaResult = Span.with( e => e.primaryElement.classList.add(demoStyles.formula_result) );

export const Formula = (result: string, ...derivation: Appendable[]): Appendable => ([
  FormulaResult({}, result), " &larr; ", derivation  
])