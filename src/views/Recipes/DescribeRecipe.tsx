import React from "react";
import { AndClause } from "~views/basics";
import { SavedRecipe } from "../../dicekeys";
import { DiceKeysAppSecretRecipe } from "./RecipeBuilderState";

export const describeRecipeType = (type: SavedRecipe["type"]): string => {
  switch (type) {
    case "Secret": return "Seed or other secret";
    case "SigningKey": return "Cryptographic key (public/private signing/authentication)";
    case "SymmetricKey": return "Cryptographic key (symmetric)";
    case "UnsealingKey": return "Cryptographic key (public/private encryption)";
    case "Password": return "Password";
    default: return type;
  }
}

export const describeRecipe = (partialSavedRecipe: Omit<SavedRecipe, "name">) => {
  const {type, recipeJson} = partialSavedRecipe;
  let recipe: DiceKeysAppSecretRecipe = (() => {
    try {
      return JSON.parse(recipeJson) as DiceKeysAppSecretRecipe;
    } catch {
      console.log(`Invalid recipe JSON: ${recipeJson}`)
      return {};
    }
  })();
  const withClauses: JSX.Element[] = [];
  if (type === "Password" && recipe.lengthInChars) {
    withClauses.push((<> a maximum length of <i>{ recipe.lengthInChars }</i> characters</>));
  }
  if (recipe["#"]) {
    withClauses.push((<> sequence number <i>{recipe["#"]}</i></>));
  }  
  return (
    <>Create a {describeRecipeType(type).toLocaleLowerCase()}
      { !recipe.purpose ? null : (
        <> for the purpose of <i>{ recipe.purpose }</i></>
      )}{ withClauses.length == 0 ? null : (
        <> with <AndClause items={withClauses}/></>
      )}{ !recipe.allow || recipe.allow.length == 0 ? null : (
        <> accessible to  <AndClause items={recipe.allow.map( ({host}) => 
        host.startsWith("*.") ?
          (<><i>{ host.substring(2) }</i></>) :
          (<><i>{ host }</i> (excluding subdomains)</>)
        )}/>
      </>)}.</>
  );
}