import {DerivableObjectName, DerivableObjectNames, Recipe} from "@dicekeys/dicekeys-api-js"
import { describeRecipeType } from "../views/Recipes/DescribeRecipeType";
import { jsonStringifyWithSortedFieldOrder } from "../utilities/json";

export type DerivationRecipeType = DerivableObjectName

export const isDerivationRecipeType = (s: unknown): s is DerivationRecipeType => {
  return (typeof s === "string") && s in DerivableObjectNames;
}

export interface StoredRecipeUniqueIdentifier {
  readonly type: DerivationRecipeType;
  readonly recipeJson: string;
}

export interface StoredRecipe extends StoredRecipeUniqueIdentifier {
  readonly name?: string;
}

export const isStoredRecipe = (candidate: unknown): candidate is StoredRecipe => {
  if (typeof candidate !== "object") return false;
  if (candidate == null) return false;
  if (!("type" in candidate)) return false;
  if (!isDerivationRecipeType((candidate as StoredRecipe).type)) return false;
  if (!("recipeJson" in candidate)) return false;
  if (typeof ((candidate as StoredRecipe).recipeJson) !== "string") return false;
  if (("name" in candidate) && typeof ((candidate as StoredRecipe).name) !== "string") return false;
  return true;
}

export class BuiltInRecipe<NAME extends string = string> implements StoredRecipe {
  constructor(
    public readonly type: DerivationRecipeType,
    public readonly name: NAME,
    public readonly recipeJson: string
  ) {
  }
}

export type LoadedRecipeOrigin = "BuiltIn" | "Saved" | "Template";

export interface LoadedRecipe<ORIGIN extends LoadedRecipeOrigin = LoadedRecipeOrigin, NAME extends string = string> {
  readonly origin: ORIGIN;
  readonly type: DerivationRecipeType;
  readonly name: ORIGIN extends "Saved" ? NAME : (NAME | undefined);
  readonly recipeJson: ORIGIN extends "Template" ? (string | undefined) : string;
}

export const BuiltInRecipes: StoredRecipe[] = [
	new BuiltInRecipe("Password", "1Password", `{"allow":[{"host":"*.1password.com"}]}`),
	new BuiltInRecipe("Password", "Apple", `{"allow":[{"host":"*.apple.com"},{"host":"*.icloud.com"}],"lengthInChars":64}`),
	new BuiltInRecipe("Password", "Authy", `{"allow":[{"host":"*.authy.com"}]}`),
	new BuiltInRecipe("Password", "Bitwarden", `{"allow":[{"host":"*.bitwarden.com"}]}`),
	new BuiltInRecipe("Password", "Facebook", `{"allow":[{"host":"*.facebook.com"}]}`),
	new BuiltInRecipe("Password", "Google", `{"allow":[{"host":"*.google.com"}]}`),
	new BuiltInRecipe("Password", "Keeper", `{"allow":[{"host":"*.keepersecurity.com"},{"host":"*.keepersecurity.eu"}]}`),
	new BuiltInRecipe("Password", "LastPass", `{"allow":[{"host":"*.lastpass.com"}]}`),
	new BuiltInRecipe("Password", "Microsoft", `{"allow":[{"host":"*.microsoft.com"},{"host":"*.live.com"}]}`),
	new BuiltInRecipe("Password", "Mozilla Firefox", `{"allow":[{"host":"*.firefox.com"}]}`),
	new BuiltInRecipe("SigningKey", "SSH", `{"purpose":"ssh"}`),
	new BuiltInRecipe("SigningKey", "PGP", `{"purpose":"pgp"}`),
	new BuiltInRecipe("Secret", "Cryptocurrency wallet seed", `{"purpose":"wallet"}`),
];


const savedPrefix = "saved:";
const builtInPrefix = "builtIn:";
const customPrefix = "custom:";
export type SavedRecipeIdentifier = `${typeof savedPrefix}${string}`;
export type BuiltInRecipeIdentifier = `${typeof builtInPrefix}${string}`;
export type CustomRecipeIdentifier = `${typeof customPrefix}${string}`;
export type RecipeIdentifier = SavedRecipeIdentifier | BuiltInRecipeIdentifier | CustomRecipeIdentifier;
export type PotentialRecipeIdentifier = RecipeIdentifier | string;
export const savedRecipeIdentifier = (storedRecipe: StoredRecipe) =>
  `${savedPrefix}${jsonStringifyWithSortedFieldOrder(storedRecipe)}` as SavedRecipeIdentifier;
export const builtInRecipeIdentifier = (storedRecipe: StoredRecipe) =>
  `${builtInPrefix}${jsonStringifyWithSortedFieldOrder(storedRecipe)}` as BuiltInRecipeIdentifier;
export const customRecipeIdentifier = (storedRecipe: Omit<StoredRecipe, "recipeJson" | "name">) =>
  `${customPrefix}${jsonStringifyWithSortedFieldOrder(storedRecipe)}` as CustomRecipeIdentifier;
export const isSavedRecipeIdentifier = 
  (recipeIdentifier?: SavedRecipeIdentifier | string): recipeIdentifier is SavedRecipeIdentifier =>
    !!(recipeIdentifier?.startsWith(savedPrefix));
export const isBuiltInRecipeIdentifier = 
  (recipeIdentifier?: BuiltInRecipeIdentifier | string): recipeIdentifier is BuiltInRecipeIdentifier =>
    !!(recipeIdentifier?.startsWith(builtInPrefix));
export const isCustomRecipeIdentifier = 
  (recipeIdentifier?: CustomRecipeIdentifier | string): recipeIdentifier is CustomRecipeIdentifier =>
    !!(recipeIdentifier?.startsWith(customPrefix));
export const savedRecipeIdentifierToStoredRecipe = 
  (identifier: SavedRecipeIdentifier) =>
    ({origin: "Saved", ...(JSON.parse(identifier.substr(savedPrefix.length)) as StoredRecipe)} as LoadedRecipe<"Saved">);
export const builtInRecipeIdentifierToStoredRecipe = 
  (identifier: BuiltInRecipeIdentifier) =>
    ({origin: "BuiltIn", ...(JSON.parse(identifier.substr(builtInPrefix.length)) as StoredRecipe)} as LoadedRecipe<"BuiltIn">);
export const customRecipeIdentifierToStoredRecipe = 
  (identifier: CustomRecipeIdentifier) => ({origin: "Template", ...JSON.parse(identifier.substr(customPrefix.length))}) as LoadedRecipe<"Template">;

export const storedRecipeIfSavedRecipeIdentifier =
(identifier: SavedRecipeIdentifier | string | undefined) =>
    (isSavedRecipeIdentifier(identifier) ? savedRecipeIdentifierToStoredRecipe(identifier) : undefined)  as (
      typeof identifier extends SavedRecipeIdentifier ? StoredRecipe : undefined
    );
export const storedRecipeIfBuiltInRecipeIdentifier =
  (identifier: BuiltInRecipeIdentifier | string | undefined) =>
    (isBuiltInRecipeIdentifier(identifier) ? builtInRecipeIdentifierToStoredRecipe(identifier) : undefined)  as (
      typeof identifier extends BuiltInRecipeIdentifier ? StoredRecipe : undefined
    );
export const storedRecipeIfCustomRecipeIdentifier =
  (identifier: CustomRecipeIdentifier | string | undefined) =>
    (isCustomRecipeIdentifier(identifier) ? customRecipeIdentifierToStoredRecipe(identifier) : undefined)  as (
      typeof identifier extends CustomRecipeIdentifier ? StoredRecipe : undefined
    );
export const getStoredRecipe = (recipeIdentifier?: PotentialRecipeIdentifier): LoadedRecipe | undefined => {
  return storedRecipeIfSavedRecipeIdentifier(recipeIdentifier) ??
    storedRecipeIfBuiltInRecipeIdentifier(recipeIdentifier) ??
    storedRecipeIfCustomRecipeIdentifier(recipeIdentifier);
}

export const getRecipeNameSuffix = (recipe: Recipe, type: DerivableObjectName): string => {
  const sequenceNumber = recipe["#"];
  return ` ${describeRecipeType(type)}${
        "lengthInBytes" in recipe ? ` (${recipe.lengthInBytes} bytes)` : ""
    }${ "lengthInChars" in recipe ? ` (${recipe.lengthInChars} chars)` : ""
    }${ sequenceNumber == null ? "" : ` #${sequenceNumber}`
  }`;
}

export const getStoredRecipeNameSuffix = (storedRecipe: Partial<StoredRecipe>): string => {
  const {type, recipeJson} = storedRecipe;
  if (!type || !recipeJson) return "";
  try {
    const recipe = JSON.parse(recipeJson) as Recipe;
    return getRecipeNameSuffix(recipe, type);
  } catch {
    return describeRecipeType(type);
  }
}

export const recipeDefaultBaseName = (recipe: Recipe): string | undefined =>
  recipe.purpose?.substr(0, 20) ?? recipe.allow?.map( ({host})=> host).join(", ");

export const enhancedRecipeName = (recipe: Recipe, type: DerivationRecipeType, baseName?: string): string | undefined => {
  const base = (baseName != null && baseName.length > 0) ? baseName : recipeDefaultBaseName(recipe);
  if (base == null) return;
  const baseNameLc = baseName?.toLocaleLowerCase() ?? "";
  // Dont add a suffix if...
  if (
    // The name of a secret already contains the word "secret" or "seed".
    (type==="Secret" && (baseNameLc.indexOf("seed") >= 0) || baseNameLc.indexOf("secret") >= 0) ||
    // The name of a password already contains the word "password".
    (type==="Password" && (baseNameLc.indexOf("password") >= 0)) ||
    // The name of a key already contains the word "key".
    ((type==="SigningKey" || type==="SymmetricKey" || type==="UnsealingKey") && (baseNameLc.indexOf("key") >= 0))
  ) {
    return base;
  }
  return `${base}${getRecipeNameSuffix(recipe, type)}`;
}

export const enhancedStoredRecipeName = (storedRecipe: StoredRecipe): string | undefined => {
  try {
    const recipe = JSON.parse(storedRecipe.recipeJson) as Recipe;
    return enhancedRecipeName(recipe, storedRecipe.type,  storedRecipe.name);
} catch {
    return;
  }
}

export const isRecipeBuiltIn = (storedRecipe: Partial<StoredRecipe>): boolean =>
  !!BuiltInRecipes.find( savedRecipe =>
    storedRecipe.recipeJson === savedRecipe.recipeJson &&
    storedRecipe.type === savedRecipe.type  &&
    storedRecipe.name === savedRecipe.name
  )

// const commaSeparatedHostsToBuiltInRecipe = BuiltInRecipes.reduce( (result, savedRecipe) => {
//   const hosts = recipeJsonToHosts(savedRecipe.recipeJson);
//   if (hosts.length > 0) {
//     result[hosts.join(",")] = savedRecipe
//   }
//   return result
// }, {} as Record<string, StoredRecipe>);

// export const purposeToBuiltInRecipe = (purposeField?: string): StoredRecipe | undefined => {
//   const hosts = purposeToListOfHosts(purposeField);
//   if (hosts == null) return undefined;
//   return commaSeparatedHostsToBuiltInRecipe[hosts.join(",")];
// }
