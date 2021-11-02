export function cssCalcInputExpr<EXPRESSION_WITHIN_CALC extends string>(expression: `calc(${EXPRESSION_WITHIN_CALC})`): `(${EXPRESSION_WITHIN_CALC})`;
export function cssCalcInputExpr<EXPRESSION_IN_PARES extends string>(expression: `(${EXPRESSION_IN_PARES})`): `(${EXPRESSION_IN_PARES})`;
export function cssCalcInputExpr<EXPRESSION_OUTSIDE_CALC extends string>(expression: EXPRESSION_OUTSIDE_CALC): `(${EXPRESSION_OUTSIDE_CALC})`;
export function cssCalcInputExpr(expression: string) {
  return (expression.startsWith("calc(") && expression.endsWith(")")) ?
      // remove calc but keep the parens
      expression.substr(4) :
    (expression.startsWith("(") && expression.endsWith(")")) ?
      // already in parens, leave them in place
      expression :
      // add parens to a expression with none
      `(${expression})`;
}

export const cssCalc = <EXPRESSION extends string>(expression: EXPRESSION) =>
  (
    (expression.startsWith("calc(") && expression.endsWith(")")) ? expression : `calc(${expression})`
  ) as EXPRESSION extends `calc(${string})` ? EXPRESSION : `calc(${EXPRESSION})`
;

// export const example = calc(`${exprToCalc("calc(x-y)")} - ${exprToCalc("3-4")} + ${exprToCalc(`(a * b)`)}`);