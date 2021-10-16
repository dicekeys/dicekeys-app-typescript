import {Recipe} from "@dicekeys/dicekeys-api-js"
import { modifyJson } from "../utilities/modifyJson";
import { getRegisteredDomain } from "../domains/get-registered-domain";

const addOrAppendFieldToJsonObjectString =
  <T=any>(fieldName: string, quote: boolean = false, doNotAddIfValueIs?: T) =>
    (originalJsonObjectString: string | undefined, fieldValue?: T): string | undefined => {
  // Try to replace the field if it already exists in the target object
  const targetKey = `[${JSON.stringify(fieldName)}]`
  if (originalJsonObjectString != null) {
    // Trying modifying the original JSON string
    var wasJsonModifiedInPlace: boolean = false;
    const jsonWithFieldReplaced = modifyJson(originalJsonObjectString, ({key, replaceValueWithNewValue: replaceWithNewValue, replaceValueWithNewJsonEncodedValue, remove}) => {
        if (key == targetKey) {
          wasJsonModifiedInPlace = true;
          if (typeof fieldValue === "undefined" || fieldValue === doNotAddIfValueIs) {
            remove();
          } else {
            if (!quote && typeof fieldValue == "string") {
              replaceValueWithNewJsonEncodedValue(fieldValue);
            } else {
              replaceWithNewValue(fieldValue);
            }
          }
        }
        return;
      });
    if (wasJsonModifiedInPlace) {
      return jsonWithFieldReplaced;
    }
  }
  // Append to the end of a JSON object.
  if (typeof fieldValue == "undefined" || fieldValue == doNotAddIfValueIs) {
    // Don't add the field value if it's not defined or the value not to be added
    return originalJsonObjectString;
  }
  const srcString = (typeof originalJsonObjectString === "undefined" || originalJsonObjectString.length === 0) ? "{}" : originalJsonObjectString;
  const lastClosingBraceIndex = srcString.lastIndexOf("}");
  if (lastClosingBraceIndex < 0) {return srcString }
  const prefixUpToFinalClosingBrace = srcString.substr(0, lastClosingBraceIndex);
  const suffixIncludingFinalCloseBrace = srcString.substr(lastClosingBraceIndex);
  const commaIfObjectNonEmpty = srcString.indexOf(":") > 0 ? "," : "";
  const fieldValueString = typeof fieldValue == "string" && quote ? `"${fieldValue.replace(/\"/g, "\\\"")}"` : `${fieldValue}`;
  return prefixUpToFinalClosingBrace + `${commaIfObjectNonEmpty}"${fieldName}":${fieldValueString}` + suffixIncludingFinalCloseBrace;
}

export const addLengthInBytesToRecipeJson: <T extends string | undefined>(recipeWithoutLengthInBytes: T, lengthInBytes?: number) => string | undefined = addOrAppendFieldToJsonObjectString("lengthInBytes", false, 32); 
export const addLengthInCharsToRecipeJson: <T extends string | undefined>(recipeWithoutLengthInChars: T, lengthInChars?: number) => string | undefined = addOrAppendFieldToJsonObjectString("lengthInChars", false, 0); 
export const addSequenceNumberToRecipeJson: <T extends string | undefined>(recipeWithoutSequenceNumber: T, sequenceNumber?: number) => string | undefined = addOrAppendFieldToJsonObjectString("#", false, 1);
export const addPurposeToRecipeJson: <T extends string | undefined>(recipeWithoutPurpose: T, purpose?: string) => string | undefined = addOrAppendFieldToJsonObjectString("purpose", true, "");
export const addAllowToRecipeJson: <T extends string | undefined>(recipeWithoutAllow: T, allow?: string) => string | undefined = addOrAppendFieldToJsonObjectString<string | undefined>("allow", false, undefined);

const getHostRestrictionsArrayAsString = (hosts: string[]): string =>
  `[${hosts
        .map( host => `{"host":"${host}"}` )
        .join(",")
    }]`;

const hostNameToSortOrderHostHame = (hostName: string) =>
    hostName.startsWith("*.") ? hostName.substr(2) + "*." : hostName;

export const addHostsToRecipeJson = (recipeWithoutAllow: string | undefined, hosts: string[] | undefined): string | undefined => {
  const allow = hosts == null || hosts.length === 0 ? undefined : getHostRestrictionsArrayAsString(hosts.sort(
    (a, b) => {
      return (hostNameToSortOrderHostHame(a) < hostNameToSortOrderHostHame(b)) ? -1 :
      a === b ? 0 :
      1;
    }
  ));
  return addAllowToRecipeJson(recipeWithoutAllow, allow);
}

export type RecipeFieldType = "rawJson" | "sites" | "lengthInChars" | "lengthInBytes" | keyof Recipe;

interface AddableRecipeFields {
  hosts?: string[];
  purpose?: string;
  lengthInBytes?: number;
  lengthInChars?: number;
  sequenceNumber?: number;
}

export const recipeJsonToHosts = (recipeJson: string | undefined): string[] => {
  if (recipeJson == null) return [];
  const {allow} = (JSON.parse(recipeJson) as Recipe);
  return allow == null ? [] : allow.map( ({host}) => host.trim() /* {
      host = host.trim();
      return host.startsWith("*.") ? host.substr(2) : host 
    } */
  )
  .filter( host => host.length > 0 )
  .sort();
}

export const parseCommaSeparatedListOfHosts = (
  commaSeparatedListOfHosts: string | undefined
): string[] | undefined => {
  if (commaSeparatedListOfHosts == null) return;
  try {
    const hosts = (commaSeparatedListOfHosts).split(",")
      .map( i => {
        const potentialHostName = i.trim();
        if (potentialHostName.length == 0) return;
        // Get JavaScript's URL parser to validate the hostname for us
        const registeredDomain = getRegisteredDomain(potentialHostName);
        if (registeredDomain != null) {
          return registeredDomain
        } else {
          return;
        }
      })
      .filter( i =>  i != null && i.length > 0 ) as string[];
    if (hosts.length > 0) {
      return hosts;
    }
  } catch {}
  return undefined;
}

export const getRecipeJson = (spec: AddableRecipeFields, templateRecipeJson?: string): string | undefined => {
  const {hosts, purpose, lengthInBytes, lengthInChars, sequenceNumber} = spec;
  //const templateRecipe = templateRecipeJson == null ? {} : JSON.parse(templateRecipeJson) as Recipe;
  // The recipe starts with the JSON template.

  let recipeJson: string | undefined = templateRecipeJson;
  // IMPORTANT -- changes must be applied in the correct order for JSON
  // fields to be ordered correctly and to be consistent between platforms.

  // Apply addition of hosts
  recipeJson = addHostsToRecipeJson(recipeJson, hosts);
  // Apply addition of purpose
  recipeJson = addPurposeToRecipeJson(recipeJson, purpose);
  // Apply addition of lengthInBytes
  recipeJson = addLengthInBytesToRecipeJson(recipeJson, lengthInBytes);
  // Apply addition of lengthInChars (passwords only)
  recipeJson = addLengthInCharsToRecipeJson(recipeJson, lengthInChars);
  // Apply addition of sequence number
  recipeJson = addSequenceNumberToRecipeJson(recipeJson, sequenceNumber);
  return recipeJson;
}

export const recipeJsonToAddableFields = (recipeJson: string): AddableRecipeFields => {
  try {
    const {allow, ...parsed} = JSON.parse(recipeJson) as AddableRecipeFields & Recipe;
    if (allow != null && allow.length > 0) {
      parsed.hosts = allow.map( ({host}) => host.trim()).sort()
      // Current constructor allows either purpose or hosts, but not both
      delete parsed.purpose;
    }
    if (parsed["#"] != null) {
      parsed.sequenceNumber = parsed["#"];
      delete parsed["#"];
    }
    return parsed;
  } catch {
    return {};
  }
}

// export const isRecipeJsonConstructableFromFields = (recipeJson: string): boolean => {
//   if (recipeJson = "{}" || recipeJson == "") return true;
//   try {
//     const {allow, ...parsed} = JSON.parse(recipeJson) as AddableRecipeFields & Recipe;
//     if (allow != null) {
//       parsed.hosts = allowFieldToHostList(allow);
//       // Current constructor allows either purpose or hosts, but not both
//       delete parsed.purpose;
//     }
//     return getRecipeJson(parsed) === recipeJson;
//   } catch {
//     return false;
//   }
// }
