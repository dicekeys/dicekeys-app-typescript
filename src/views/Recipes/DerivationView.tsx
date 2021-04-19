import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderView } from ".";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { DiceKeysAppSecretRecipe, RecipeBuilderState, SelectedRecipeState } from "./RecipeBuilderState";
import { RecipeTypeSelectorView } from "./RecipeTypeSelectorView";
import { SavedRecipe } from "~dicekeys";
import { DiceKey } from "~dicekeys/DiceKey";
import { RawRecipeView, RecipesDerivedValuesView } from "./RecipesDerivedValuesView";
import { AndClause, SecretFieldsCommonObscureButton } from "../../views/basics";
import { RecipeStore } from "~state/stores/RecipeStore";
import { action } from "mobx";

export const SavedRecipeView = observer( ( props: {state: RecipeBuilderState}) => {
  const {name = props.state.prescribedName, recipeJson, type} = props.state;
  const save = type && name && recipeJson && type.length > 0 && name.length > 0 && recipeJson.length > 0 ? action ( () => {
    RecipeStore.addRecipe({name, type, recipeJson});
    alert(`Added ${type}:${name}:${recipeJson}`)
  }) : undefined;
  return (
    <div>
      <input type="text" className={css.recipe_name} placeholder={ props.state.name } onInput={ (e) => props.state.setName( e.currentTarget.value )} />
      <button disabled={!save} onClick={save}>save</button>
    </div>
    )
  }
);

const describeRecipeType = (type: NonNullable<SavedRecipe["type"]>): string => {
  switch (type) {
    case "Secret": return "Seed or other secret";
    case "SigningKey": return "Cryptographic key (public/private signing)";
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
    <>This recipe creates a {describeRecipeType(type).toLocaleLowerCase()}
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

interface DerivationViewProps {
  seedString: string;
}

export const DerivationViewWithState = observer( ( {selectedRecipeState, builderState, cachedApiCalls}: {
  selectedRecipeState: SelectedRecipeState,
  builderState: RecipeBuilderState,
  cachedApiCalls: CachedApiCalls,
}) => (
  <div>
    <RecipeTypeSelectorView state={selectedRecipeState} />
    <div className={css.recipe_header}>Internal Recipe Format</div>
    <RawRecipeView state={builderState} />
    <div>{ builderState.type && describeRecipe({type: builderState.type, recipeJson: builderState.recipeJson ?? ""}) }</div>
    <div className={css.recipe_header}>Derived values <SecretFieldsCommonObscureButton/></div>
    <RecipesDerivedValuesView {...{cachedApiCalls, state: builderState}} />
    <SavedRecipeView state={builderState} />

    { selectedRecipeState.isSaved ? ("Offer to delete this!") : null }
    <RecipeBuilderView state={builderState} cachedApiCalls={cachedApiCalls} />
  </div>
));
export const DerivationView = observer ( (props: DerivationViewProps) => {
  const selectedRecipeState = new SelectedRecipeState();
  const builderState =  new RecipeBuilderState(selectedRecipeState);
  const cachedApiCalls = new CachedApiCalls(props.seedString)
  return (
    <DerivationViewWithState {...{selectedRecipeState, builderState, cachedApiCalls}}/>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView seedString={DiceKey.toSeedString(DiceKey.testExample, true) } />
)
// export const DerivationViewPreview 