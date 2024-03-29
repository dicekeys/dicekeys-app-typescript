const expressionContainsOperator = (expression: string) =>
  expression.split("").some( (char): boolean => {
    // If
    switch (char) {
      case "/":
      case "+":
      case "-":
      case "*":
          return true;
      default:
        return false;
  }});

export function cssExprWithoutCalc<EXPRESSION_WITHIN_CALC extends string>(expression: `calc(${EXPRESSION_WITHIN_CALC})`): `(${EXPRESSION_WITHIN_CALC})`;
export function cssExprWithoutCalc<EXPRESSION_IN_PARES extends string>(expression: `(${EXPRESSION_IN_PARES})`): `(${EXPRESSION_IN_PARES})`;
export function cssExprWithoutCalc<EXPRESSION_OUTSIDE_CALC extends string>(expression: EXPRESSION_OUTSIDE_CALC): `(${EXPRESSION_OUTSIDE_CALC})`;
export function cssExprWithoutCalc(expression: string) {
  return (expression.startsWith("calc(") && expression.endsWith(")")) ?
    // remove calc but keep the parens
      expression.substr(4) :
    (expression.startsWith("(") && expression.endsWith(")")) ?
      // expression already contains parens, so leave them in place
      expression :
      expressionContainsOperator(expression) ?
      // add parens to a expression with none
      `(${expression})` :
      // There's no parens, but no need for them since there's no operator
      expression
      ;
}
/**
 * Ensure an expression is wrapped in calc() so that css will calculate its value
 *
 * @param expression 
 * @returns 
 */
export const cssCalcTyped = <EXPRESSION extends string>(expression: EXPRESSION) =>
  (
    (expression.startsWith("calc(") && expression.endsWith(")")) ? expression : `calc(${expression})`
  ) as EXPRESSION extends `calc(${string})` ? EXPRESSION : `calc(${EXPRESSION})`
;

/**
 * Ensure an expression is wrapped in calc() so that css will calculate its value
 * and that any template parameters have calc() removed.
 * 
 * @param strings 
 * @param expressions 
 * @returns 
 */
export const cssCalc = <TEXTS extends TemplateStringsArray, EXPRESSIONS extends (string|number)[]>(
  strings: TEXTS,
  ...expressions: EXPRESSIONS
): string => {
  const stringsArray = [...strings];
  let result: string = "";
  while (stringsArray.length > 0 || expressions.length > 0) {
    const s = stringsArray.shift();
    if (s != null) {
      result += s;
    }
    const e = expressions.shift();
    if (e != null) {
      result += cssExprWithoutCalc(e.toString());
    }
  }
  return cssCalcTyped(result);
}

// export const example = calc(`${exprToCalc("calc(x-y)")} - ${exprToCalc("3-4")} + ${exprToCalc(`(a * b)`)}`);