import {Recipe, WebBasedApplicationIdentity} from "@dicekeys/dicekeys-api-js"
import { modifyJson } from "../utilities/modifyJson";
import { getRegisteredDomain } from "../domains/get-registered-domain";

const addOrAppendFieldToJsonObjectString =
  <T=any>(fieldName: string, quote: boolean = false, doNotAddIfValueIs?: T) =>
    (originalJsonObjectString: string | undefined, fieldValue?: T): string | undefined => {
  if (originalJsonObjectString == null) return originalJsonObjectString;
  // Try to replace the field if it already exists in the target object
  const targetKey = `[${JSON.stringify(fieldName)}]`
  var wasReplacedWithinString: boolean = false;
  const jsonWithFieldReplaced = modifyJson(originalJsonObjectString, ({key, replaceValueWithNewValue: replaceWithNewValue, remove}) => {
      if (key == targetKey) {
        if (typeof fieldValue === "undefined" || fieldValue == doNotAddIfValueIs) {
          remove();
         } else {
          replaceWithNewValue(fieldValue);
         }
        wasReplacedWithinString = true;
      }
      return;
    });
  if (wasReplacedWithinString) {
    return jsonWithFieldReplaced;
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
export const addPurposeToRecipeJson: <T extends string | undefined>(recipeWithoutPurpose: T, purpose?: string) => string | undefined = addOrAppendFieldToJsonObjectString("purpose", true);
export const addAllowToRecipeJson: <T extends string | undefined>(recipeWithoutAllow: T, allow?: string) => string | undefined = addOrAppendFieldToJsonObjectString("allow", false);

const getHostRestrictionsArrayAsString = (hosts: string[]): string =>
  `[${hosts
        .map( host => `{"host":"${host}"}` )
        .join(",")
    }]`;

export const addHostsToRecipeJson = (recipeWithoutAllow: string | undefined, hosts: string[]): string | undefined => {
  if (hosts.length === 0) return recipeWithoutAllow;
  const allow = getHostRestrictionsArrayAsString(hosts.sort());
  return addAllowToRecipeJson(recipeWithoutAllow, allow);
}

export type DiceKeysAppSecretRecipe = Recipe & {
  // FIXME -- definition of recipe out of date in API, fix that and remove this hack
  lengthInChars?: number;
  lengthInBytes?: number;
  // Sequence numbers
  '#'?: number;
  purpose?: string;
}

export type RecipeFieldType = "rawJson" | keyof DiceKeysAppSecretRecipe;

interface AddableRecipeFields {
  hosts?: string[];
  purpose?: string;
  lengthInBytes?: number;
  lengthInChars?: number;
  sequenceNumber?: number;
}

export const recipeJsonToHosts = (recipeJson: string | undefined): string[] => {
  if (recipeJson == null) return [];
  const {allow} = (JSON.parse(recipeJson) as DiceKeysAppSecretRecipe);
  return allow == null ? [] : allow.map( ({host}) => host.trim() /* {
      host = host.trim();
      return host.startsWith("*.") ? host.substr(2) : host 
    } */
  )
  .filter( host => host.length > 0 )
  .sort();
}

export const purposeToListOfHosts = (purposeField: string | undefined): string[] | undefined => {
  if (purposeField == null) return;
  try {
    const hosts = (purposeField).split(",")
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

export const allowFieldToHostList = (allow: WebBasedApplicationIdentity[]) =>
  allow.map( ({host}) => host.trim()).sort()

export const hostsToPurpose = (hosts: string[]) =>
  hosts.join(", ");

export const allowFieldToPurpose = (allow: WebBasedApplicationIdentity[]) =>
  hostsToPurpose(allowFieldToHostList(allow));

export const getRecipeJson = (spec: AddableRecipeFields, templateRecipeJson?: string): string | undefined => {
  const {hosts, purpose, lengthInBytes, lengthInChars, sequenceNumber} = spec;
  const templateRecipe = templateRecipeJson == null ? {} : JSON.parse(templateRecipeJson) as DiceKeysAppSecretRecipe;
  // The recipe starts with the JSON template.

  let recipeJson: string | undefined = templateRecipeJson;
  // IMPORTANT -- changes must be applied in the correct order for JSON
  // fields to be ordered correctly and to be consistent between platforms.

  // Apply addition of hosts
  if (templateRecipe.allow == null && hosts) {
    recipeJson = addHostsToRecipeJson(recipeJson, hosts);
  }

  // Apply addition of purpose
  if (templateRecipe.purpose == null && purpose != null && purpose.length > 0) {
    recipeJson = addPurposeToRecipeJson(recipeJson, purpose);
  }

  // Apply addition of lengthInBytes
  if (templateRecipe.lengthInBytes == null && lengthInBytes != null) {
    recipeJson = addLengthInBytesToRecipeJson(recipeJson, lengthInBytes);
  }

  // Apply addition of lengthInChars (passwords only)
  if (templateRecipe.lengthInChars == null && lengthInChars != null) {
    recipeJson = addLengthInCharsToRecipeJson(recipeJson, lengthInChars);
  }

  // Apply addition of sequence number
  if (templateRecipe["#"] == null && sequenceNumber != null && sequenceNumber > 1) {
    recipeJson = addSequenceNumberToRecipeJson(recipeJson, sequenceNumber);
  }
  return recipeJson;
}

export const recipeJsonToAddableFields = (recipeJson: string): AddableRecipeFields => {
  try {
    const {allow, ...parsed} = JSON.parse(recipeJson) as AddableRecipeFields & DiceKeysAppSecretRecipe;
    if (allow != null) {
      parsed.hosts = allowFieldToHostList(allow);
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

export const isRecipeJsonConstructableFromFields = (recipeJson: string): boolean => {
  if (recipeJson = "{}" || recipeJson == "") return true;
  try {
    const {allow, ...parsed} = JSON.parse(recipeJson) as AddableRecipeFields & DiceKeysAppSecretRecipe;
    if (allow != null) {
      parsed.hosts = allowFieldToHostList(allow);
      // Current constructor allows either purpose or hosts, but not both
      delete parsed.purpose;
    }
    return getRecipeJson(parsed) === recipeJson;
  } catch {
    return false;
  }
}
