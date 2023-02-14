import {Recipe} from "@dicekeys/dicekeys-api-js"
import { modifyJson, ParsedValue } from "../utilities/modifyJson";
import { isValidDomainOrWildcardDomain } from "../utilities/domains";

const addOrAppendFieldToJsonObjectString =
  <T extends ParsedValue>(fieldName: string, quote: boolean = false, doNotAddIfValueIs?: T) =>
    (originalJsonObjectString: string | undefined, fieldValue?: T): string | undefined => {
  // Try to replace the field if it already exists in the target object
  const targetKey = `[${JSON.stringify(fieldName)}]`
  if (originalJsonObjectString != null) {
    // Trying modifying the original JSON string
    let wasJsonModifiedInPlace: boolean = false;
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

export const addLengthInBytesToRecipeJson: (recipeWithoutLengthInBytes: string | undefined, lengthInBytes?: number) => string | undefined = addOrAppendFieldToJsonObjectString<number>("lengthInBytes", false, 32); 
export const addLengthInCharsToRecipeJson: (recipeWithoutLengthInChars: string | undefined, lengthInChars?: number) => string | undefined = addOrAppendFieldToJsonObjectString<number>("lengthInChars", false, 0); 
export const addSequenceNumberToRecipeJson: (recipeWithoutSequenceNumber: string | undefined, sequenceNumber?: number) => string | undefined = addOrAppendFieldToJsonObjectString<number>("#", false, 1);
export const addPurposeToRecipeJson: (recipeWithoutPurpose: string | undefined, purpose?: string) => string | undefined = addOrAppendFieldToJsonObjectString<string>("purpose", true, "");
export const addAllowToRecipeJson: (recipeWithoutAllow: string | undefined, allow?: string) => string | undefined = addOrAppendFieldToJsonObjectString<string>("allow", false, undefined);

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
): string[] => {
  return (commaSeparatedListOfHosts ?? "").split(",")
    // trim the entries
    .map( s => s.trim() )
    // filter out those that aren't domains or wildcard domains
    .filter( isValidDomainOrWildcardDomain );
};

export const getRecipeJson = (spec: AddableRecipeFields, templateRecipeJson?: string): string | undefined => {
  const {hosts, purpose, lengthInBytes, lengthInChars, sequenceNumber} = spec;
  //const templateRecipe = templateRecipeJson == null ? {} : JSON.parse(templateRecipeJson) as Recipe;
  // The recipe starts with the JSON template.

  let recipeJson: string | undefined = templateRecipeJson;
  // IMPORTANT -- changes must be applied in the correct order for JSON
  // fields to be ordered correctly and to be consistent between platforms.

  // Apply addition of allow
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
