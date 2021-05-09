import {DerivableObjectName, Recipe} from "@dicekeys/dicekeys-api-js"
import { describeRecipeType } from "~views/Recipes/DescribeRecipeType";
import { jsonStringifyWithSortedFieldOrder } from "../utilities/json";
import { purposeToListOfHosts, recipeJsonToHosts } from "./ConstructRecipe";

export type DerivationRecipeType = DerivableObjectName

export class StoredRecipe<NAME extends string = string> {
  constructor(
    public readonly type: DerivationRecipeType,
    public readonly name: NAME,
    public readonly recipeJson: string
  ) {
  }
}

export const BuiltInRecipes: StoredRecipe[] = [
	new StoredRecipe("Password", "1Password", `{"allow":[{"host":"*.1password.com"}]}`),
	new StoredRecipe("Password", "Apple", `{"allow":[{"host":"*.apple.com"},{"host":"*.icloud.com"}],"lengthInChars":64}`),
	new StoredRecipe("Password", "Authy", `{"allow":[{"host":"*.authy.com"}]}`),
	new StoredRecipe("Password", "Bitwarden", `{"allow":[{"host":"*.bitwarden.com"}]}`),
	new StoredRecipe("Password", "Facebook", `{"allow":[{"host":"*.facebook.com"}]}`),
	new StoredRecipe("Password", "Google", `{"allow":[{"host":"*.google.com"}]}`),
	new StoredRecipe("Password", "Keeper", `{"allow":[{"host":"*.keepersecurity.com"},{"host":"*.keepersecurity.eu"}]}`),
	new StoredRecipe("Password", "LastPass", `{"allow":[{"host":"*.lastpass.com"}]}`),
	new StoredRecipe("Password", "Microsoft", `{"allow":[{"host":"*.microsoft.com"},{"host":"*.live.com"}]}`)  
];


const savedPrefix = "saved:";
const templatePrefix = "template:";
export type SavedRecipeIdentifier= `${typeof savedPrefix}${string}`;
export type TemplateRecipeIdentifier= `${typeof templatePrefix}${string}`;
export type RecipeIdentifier = SavedRecipeIdentifier | TemplateRecipeIdentifier
export type PotentialRecipeIdentifier = RecipeIdentifier | string;
export const savedRecipeIdentifier = (storedRecipe: StoredRecipe) =>
  `${savedPrefix}${jsonStringifyWithSortedFieldOrder(storedRecipe)}` as SavedRecipeIdentifier;
export const templateRecipeIdentifier = (storedRecipe: StoredRecipe) =>
  `${templatePrefix}${jsonStringifyWithSortedFieldOrder(storedRecipe)}` as TemplateRecipeIdentifier;
export const isSavedRecipeIdentifier = 
  (recipeIdentifier?: SavedRecipeIdentifier | string): recipeIdentifier is SavedRecipeIdentifier =>
    !!(recipeIdentifier?.startsWith(savedPrefix));
export const isTemplateRecipeIdentifier = 
  (recipeIdentifier?: TemplateRecipeIdentifier | string): recipeIdentifier is TemplateRecipeIdentifier =>
    !!(recipeIdentifier?.startsWith(templatePrefix));
export const savedRecipeIdentifierToStoredRecipe = 
  (identifier: SavedRecipeIdentifier): StoredRecipe => JSON.parse(identifier.substr(savedPrefix.length)) as StoredRecipe;
export const templateRecipeIdentifierToStoredRecipe = 
  (identifier: TemplateRecipeIdentifier): StoredRecipe => JSON.parse(identifier.substr(templatePrefix.length)) as StoredRecipe;

export const storedRecipeIfSavedRecipeIdentifier =
(identifier: SavedRecipeIdentifier | string | undefined) =>
    (isSavedRecipeIdentifier(identifier) ? savedRecipeIdentifierToStoredRecipe(identifier) : undefined)  as (
      typeof identifier extends SavedRecipeIdentifier ? StoredRecipe : undefined
    );
export const storedRecipeIfTemplateRecipeIdentifier =
  (identifier: TemplateRecipeIdentifier | string | undefined) =>
    (isTemplateRecipeIdentifier(identifier) ? templateRecipeIdentifierToStoredRecipe(identifier) : undefined)  as (
      typeof identifier extends TemplateRecipeIdentifier ? StoredRecipe : undefined
    );

export const getStoredRecipe = (recipeIdentifier?: PotentialRecipeIdentifier): StoredRecipe | undefined => {
  return storedRecipeIfSavedRecipeIdentifier(recipeIdentifier) ??
    storedRecipeIfTemplateRecipeIdentifier(recipeIdentifier);
}

export type DiceKeysAppSecretRecipe = Recipe & {
  // FIXME -- definition of recipe out of date in API, fix that and remove this hack
  lengthInChars?: number;
  lengthInBytes?: number;
  // Sequence numbers
  '#'?: number;
  purpose?: string;
}

export const getStoredRecipeNameSuffix = (storedRecipe: StoredRecipe): string => {
  const {type, recipeJson} = storedRecipe;
  const recipe = JSON.parse(recipeJson) as DiceKeysAppSecretRecipe;
  const {lengthInBytes, lengthInChars} = recipe;
  const sequenceNumber = recipe["#"];
  return `${describeRecipeType(type)}${
        lengthInBytes == null ? "" : ` (${lengthInBytes} bytes)`
    }${ lengthInChars == null ? "" : ` (${lengthInChars} chars)`
  }${ sequenceNumber == null ? "" : ` #${sequenceNumber}`
}`;
}

export const enhancedStoredRecipeName = (storedRecipe: StoredRecipe): string => {
  const {name} = storedRecipe;
  return `${name} ${getStoredRecipeNameSuffix(storedRecipe)}`;
}

const commaSeparatedHostsToBuiltInRecipe = BuiltInRecipes.reduce( (result, savedRecipe) => {
  const hosts = recipeJsonToHosts(savedRecipe.recipeJson);
  if (hosts.length > 0) {
    result[hosts.join(",")] = savedRecipe
  }
  return result
}, {} as Record<string, StoredRecipe>);

export const purposeToBuiltInRecipe = (purposeField?: string): StoredRecipe | undefined => {
  const hosts = purposeToListOfHosts(purposeField);
  if (hosts == null) return undefined;
  return commaSeparatedHostsToBuiltInRecipe[hosts.join(",")];
}
