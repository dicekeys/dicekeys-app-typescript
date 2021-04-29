import React from "react";
import { AndClause } from "~views/basics";
import { SavedRecipe } from "../../dicekeys";
import { DiceKeysAppSecretRecipe } from "./RecipeBuilderState";
import css from "./recipe-builder.module.css";

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

const HostNameView = ({host}: {host: string}) => (
  host.startsWith("*.") ?
  (<><span className={css.host_name_span}>{ host.substring(2) }</span></>) :
  (<><span className={css.host_name_span}>{ host }</span> (excluding subdomains)</>)
)

export const RecipeDescriptionView = (partialSavedRecipe: Omit<SavedRecipe, "name">) => {
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
    withClauses.push((<> a maximum length of <span className={css.length_span}>{ recipe.lengthInChars }</span> characters</>));
  }
  if (recipe["#"]) {
    withClauses.push((<> sequence number <span className={css.sequence_number_span}>{recipe["#"]}</span></>));
  }  
  return (
    <>Create a {describeRecipeType(type).toLocaleLowerCase()}
      { !recipe.purpose ? null : (
        <> for the purpose of <span className={css.host_name_span}>{ recipe.purpose }</span></>
      )}{ withClauses.length == 0 ? null : (
        <> with <AndClause items={withClauses}/></>
      )}{ !recipe.allow || recipe.allow.length == 0 ? null : (
        <> that <AndClause items={recipe.allow.map( ({host}) => (<HostNameView {...{host}}/>)
        )}/>
        &nbsp;may request
      </>)}.</>
  );
}