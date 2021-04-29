import css from "./recipe-builder.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderView } from ".";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { RecipeBuilderState, savedRecipeIdentifier, SelectedRecipeState } from "./RecipeBuilderState";
import { RecipeTypeSelectorView } from "./RecipeTypeSelectorView";
import { DiceKey } from "~dicekeys/DiceKey";
import { RawRecipeView, RecipesDerivedValuesView } from "./RecipesDerivedValuesView";
import { SecretFieldsCommonObscureButton } from "../../views/basics";
import { RecipeStore } from "~state/stores/RecipeStore";
import { action } from "mobx";
import { RecipeDescriptionView } from "./RecipeDescriptionView";

export const SavedRecipeView = observer( ( props: {recipeBuilderState: RecipeBuilderState, selectedRecipeState: SelectedRecipeState}) => {
  const {name = props.recipeBuilderState.prescribedName, recipeJson, type} = props.recipeBuilderState;
  if (!type || typeof recipeJson === "undefined") {
    return null;
  }
  const isNameSaved = props.recipeBuilderState.name && RecipeStore.recipeForName(props.recipeBuilderState.name);
  const isIdenticalToSaved = isNameSaved &&
    RecipeStore.recipeForName(props.recipeBuilderState.name!)?.type === props.recipeBuilderState.type &&
    RecipeStore.recipeForName(props.recipeBuilderState.name!)?.recipeJson === props.recipeBuilderState.recipeJson;
    const disableSaveButton = isIdenticalToSaved || typeof name === "undefined" || name.length === 0 ||
    (
      props.selectedRecipeState.savedRecipe?.name === props.recipeBuilderState.name &&
      props.selectedRecipeState.savedRecipe?.type === props.recipeBuilderState.type &&
      props.selectedRecipeState.savedRecipe?.recipeJson === props.recipeBuilderState.recipeJson
    )
    const saveWillReplace = isNameSaved && !isIdenticalToSaved;

    const save = recipeJson && name != null && name.length > 0 && recipeJson.length > 0 ? action ( () => {
    RecipeStore.addRecipe({name, type, recipeJson});
    props.selectedRecipeState.setSelectedRecipeIdentifier(savedRecipeIdentifier(name));
    alert(`Added ${type}:${name}:${recipeJson}`)
  }) : undefined;
  const remove = isIdenticalToSaved && name ? action ( () => {
    RecipeStore.removeRecipeByName(name);
    props.selectedRecipeState.setSelectedRecipeIdentifier(savedRecipeIdentifier(name));
    alert(`Removed ${type}:${name}:${recipeJson}`)
  }) : undefined;
  return (
    <div>
      <input type="text" className={css.recipe_name} placeholder={ props.recipeBuilderState.name } onInput={ (e) => props.recipeBuilderState.setName( e.currentTarget.value )} />
      <button disabled={disableSaveButton} onClick={save}>{ saveWillReplace ? "replace" : "save" }</button>
      <button style={{visibility: isIdenticalToSaved ? "visible" : "hidden"}} onClick={remove}>delete</button>
    </div>
    )
  }
);

interface DerivationViewProps {
  seedString: string;
}

export const DerivationViewWithState = observer( ( {selectedRecipeState, recipeBuilderState, cachedApiCalls}: {
  selectedRecipeState: SelectedRecipeState,
  recipeBuilderState: RecipeBuilderState,
  cachedApiCalls: CachedApiCalls,
}) => (
  <div>
    <RecipeTypeSelectorView state={selectedRecipeState} />
    <div style={{minHeight: "2rem"}}>{
        recipeBuilderState.type ?
          RecipeDescriptionView({type: recipeBuilderState.type, recipeJson: recipeBuilderState.recipeJson ?? ""}) :
          "Select recipe to use to derive secret" }</div>
    <RawRecipeView state={recipeBuilderState} />
    <RecipeBuilderView state={recipeBuilderState} cachedApiCalls={cachedApiCalls} />
    <div className={css.recipe_header}>Derived values <SecretFieldsCommonObscureButton/></div>
    <RecipesDerivedValuesView {...{cachedApiCalls, state: recipeBuilderState}} />
    {/* <div className={css.recipe_header}>Internal Recipe Format</div> */}
    <SavedRecipeView {...{recipeBuilderState, selectedRecipeState}} />
  </div>
));
export const DerivationView = observer ( (props: DerivationViewProps) => {
  const selectedRecipeState = new SelectedRecipeState();
  const recipeBuilderState =  new RecipeBuilderState(selectedRecipeState);
  const cachedApiCalls = new CachedApiCalls(props.seedString)
  return (
    <DerivationViewWithState {...{selectedRecipeState, recipeBuilderState, cachedApiCalls}}/>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView seedString={DiceKey.toSeedString(DiceKey.testExample, true) } />
)
// export const DerivationViewPreview 