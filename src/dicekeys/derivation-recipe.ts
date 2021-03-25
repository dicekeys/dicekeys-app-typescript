import {DerivableObjectName} from "@dicekeys/dicekeys-api-js"

export type DerivationRecipeType = DerivableObjectName

export class DerivationRecipe {
  constructor(
    public readonly type: DerivationRecipeType,
    public readonly name: string,
    public readonly recipeJson: string
  ) {
  }
}

const addFieldToEndOfJsonObjectString = (fieldName: string, doNotAddIfValueIs?: string | number) => (originalJsonObjectString: string, fieldValue?: string | number): string => {
  if (typeof fieldValue == "undefined" || fieldValue == doNotAddIfValueIs) return originalJsonObjectString;
  const lastClosingBraceIndex = originalJsonObjectString.lastIndexOf("}");
  if (lastClosingBraceIndex < 0) {return originalJsonObjectString }
  const prefixUpToFinalClosingBrace = originalJsonObjectString.substr(0, lastClosingBraceIndex);
  const suffixIncludingFinalCloseBrace = originalJsonObjectString.substr(lastClosingBraceIndex);
  const commaIfObjectNonEmpty = originalJsonObjectString.indexOf(":") > 0 ? "," : "";
  const fieldValueString = typeof fieldValue == "string" ? `"${fieldValue.replace("\"", "\\\"")}"` : `${fieldValue}`;
  return prefixUpToFinalClosingBrace + `${commaIfObjectNonEmpty}"${fieldName}":${fieldValueString}` + suffixIncludingFinalCloseBrace;
}

export const addLengthInCharsToRecipeJson: (recipeWithoutLengthInChars: string, lengthInChars: number) => string = addFieldToEndOfJsonObjectString("lengthInChars", 0); 
export const addSequenceNumberToRecipeJson: (recipeWithoutSequenceNumber: string, sequenceNumber: number) => string = addFieldToEndOfJsonObjectString("#", 1);
