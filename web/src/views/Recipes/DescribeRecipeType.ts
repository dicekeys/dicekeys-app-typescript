import { DerivableObjectName, DerivableObjectNames } from "@dicekeys/dicekeys-api-js";

export const DerivableObjectNameList =
Object.keys(DerivableObjectNames) as DerivableObjectName[]

export const describeRecipeType = (
  type: DerivableObjectName | undefined,
  {capitalize, pluralize}: {
    capitalize?: boolean,
    pluralize?: boolean,
  } = {}  
): string => {
  const s = pluralize ? "s" : "";
  const cap = (s: string): string => capitalize ? s.toLocaleUpperCase() : s; 
  switch (type) {
    case "Secret": return `${cap('s')}eed${s} or other secret${s}`;
    case "SigningKey": return `${cap('s')}igning/authentication key${s}`;
    case "SymmetricKey": return `${cap('s')}ymmetric cryptographic key${s}`;
    case "UnsealingKey": return `${cap('p')}ublic/private key pair${s}`;
    case "Password": return `${cap('p')}assword${s}`;
    default: return `${cap('s')}ecret${s}`;
  }
}

export const recipeTypes = DerivableObjectNameList.map( key => ({key, name: describeRecipeType(key)}));