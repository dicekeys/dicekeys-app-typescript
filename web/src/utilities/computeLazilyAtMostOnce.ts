export const computeLazilyAtMostOnce = <T>(fn: () => T): (() => T) => {
  let fnResultHasBeenWrittenToResultVariable: boolean = false;
  let result: T;
  return (() => {
    if (!fnResultHasBeenWrittenToResultVariable) {
      result = fn();
      fnResultHasBeenWrittenToResultVariable = true;
    }
    return result!;
  });
}
