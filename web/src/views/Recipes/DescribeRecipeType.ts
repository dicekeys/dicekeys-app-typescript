import { DerivableObjectName, DerivableObjectNames } from "@dicekeys/dicekeys-api-js";

export const DerivableObjectNameList =
Object.keys(DerivableObjectNames) as DerivableObjectName[]

export const describeRecipeType = (type?: DerivableObjectName): string => {
  switch (type) {
    case "Secret": return "seed or other secret";
    case "SigningKey": return "signing/authentication key";
    case "SymmetricKey": return "symmetric cryptographic key";
    case "UnsealingKey": return "public/private key pair";
    case "Password": return "password";
    default: return "secret";
  }
}

export const recipeTypes = DerivableObjectNameList.map( key => ({key, name: describeRecipeType(key)}));