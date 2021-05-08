import React from "react";
import { AndClause } from "~views/basics";
import { DiceKeysAppSecretRecipe, SavedRecipe } from "../../dicekeys";
import { describeRecipeType } from "./DescribeRecipeType";
import css from "./RecipeBuilderView.css";


const HostNameView = ({host}: {host: string}) => (
  host.startsWith("*.") ?
  (<><span className={css.host_name_span}>{ host.substring(2) }</span></>) :
  (<><span className={css.host_name_span}>{ host }</span> (excluding subdomains)</>)
)

export const RecipeDescriptionContentView = ({type, recipeJson}: Partial<SavedRecipe>) => {
  if (!type || !recipeJson) return <></>;
  let recipe: DiceKeysAppSecretRecipe = (() => {
    try {
      return JSON.parse(recipeJson ?? "{}") as DiceKeysAppSecretRecipe;
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
    <>Creates a {describeRecipeType(type).toLocaleLowerCase()}
      { !recipe.purpose ? null : (
        <> for the purpose of &lsquo;<span className={css.host_name_span}>{ recipe.purpose }</span>&rsquo;</>
      )}{ !recipe.allow || recipe.allow.length == 0 ? null : (
        <> for use by <AndClause items={recipe.allow.map( ({host}) => (<HostNameView {...{host}}/>)
          )}/>
        </>)
      }{ withClauses.length == 0 ? null : (
        <> with <AndClause items={withClauses}/></>
      )}.</>
  );
}

export const RecipeDescriptionView = (props: Partial<SavedRecipe>) => (
  <div className={css.RecipeDescriptionView} >
    <RecipeDescriptionContentView {...props} />
  </div>
)