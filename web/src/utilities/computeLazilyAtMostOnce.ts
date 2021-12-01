export const computeLazilyAtMostOnce = <T>(fn: () => T): (() => T) => {
  var fnResultHasBeenWrittenToResultVariable: boolean = false;
  var result: T;
  return (() => {
    if (!fnResultHasBeenWrittenToResultVariable) {
      result = fn();
      fnResultHasBeenWrittenToResultVariable = true;
    }
    return result!;
  });
}
