import {DerivableObjectName} from "@dicekeys/dicekeys-api-js"

export type DerivationRecipeType = DerivableObjectName

export class SavedRecipe {
  constructor(
    public readonly type: DerivationRecipeType,
    public readonly name: string,
    public readonly recipeJson: string
  ) {
  }
}

const addFieldToEndOfJsonObjectString = (fieldName: string, quote: boolean = false, doNotAddIfValueIs: string | number | undefined = undefined) =>
  (originalJsonObjectString: string | undefined, fieldValue?: string | number): string | undefined => {
  if (typeof fieldValue == "undefined" || fieldValue == doNotAddIfValueIs) return originalJsonObjectString;
  const srcString = (typeof originalJsonObjectString === "undefined" || originalJsonObjectString.length === 0) ? "{}" : originalJsonObjectString;
  const lastClosingBraceIndex = srcString.lastIndexOf("}");
  if (lastClosingBraceIndex < 0) {return srcString }
  const prefixUpToFinalClosingBrace = srcString.substr(0, lastClosingBraceIndex);
  const suffixIncludingFinalCloseBrace = srcString.substr(lastClosingBraceIndex);
  const commaIfObjectNonEmpty = srcString.indexOf(":") > 0 ? "," : "";
  const fieldValueString = typeof fieldValue == "string" && quote ? `"${fieldValue.replace(/\"/g, "\\\"")}"` : `${fieldValue}`;
  return prefixUpToFinalClosingBrace + `${commaIfObjectNonEmpty}"${fieldName}":${fieldValueString}` + suffixIncludingFinalCloseBrace;
}

export const addLengthInCharsToRecipeJson: <T extends string | undefined>(recipeWithoutLengthInChars: T, lengthInChars?: number) => string | undefined = addFieldToEndOfJsonObjectString("lengthInChars", false, 0); 
export const addSequenceNumberToRecipeJson: <T extends string | undefined>(recipeWithoutSequenceNumber: T, sequenceNumber?: number) => string | undefined = addFieldToEndOfJsonObjectString("#", false, 1);
export const addPurposeToRecipeJson: <T extends string | undefined>(recipeWithoutPurpose: T, purpose?: string) => string | undefined = addFieldToEndOfJsonObjectString("purpose", true);
export const addAllowToRecipeJson: <T extends string | undefined>(recipeWithoutAllow: T, allow?: string) => string | undefined = addFieldToEndOfJsonObjectString("allow", false);

const getHostRestrictionsArrayAsString = (hosts: string[]): string =>
  `[${hosts
        .map( host => `{"host":"*.${host}"}` )
        .join(",")
    }]`;

export const addHostsToRecipeJson = (recipeWithoutAllow: string | undefined, hosts: string[]): string | undefined => {
  if (hosts.length === 0) return recipeWithoutAllow;
  const allow = getHostRestrictionsArrayAsString(hosts.sort());
  return addAllowToRecipeJson(recipeWithoutAllow, allow);
}
