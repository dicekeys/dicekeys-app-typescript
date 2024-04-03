import React from "react";
import { observer  } from "mobx-react";
import { BuiltInRecipes, enhancedStoredRecipeName, getStoredRecipe, savedRecipeIdentifier, builtInRecipeIdentifier, customRecipeIdentifier } from "../../dicekeys/StoredRecipe";
import { RecipeStore } from "../../state/stores/RecipeStore";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";
import styled, {css} from "styled-components";

const SelectRecipe = styled.select<{$nothingChosenYet: boolean}>`
  align-self: flex-start;
  border: none;
  outline: 0px;
  padding: 0.25rem;
  border-radius: 0.5rem;
  color: rgba(0, 0, 0, 0.5);
  background-color: rgba(255, 254, 171, 0.75);
  font-family: sans-serif;
  ${(props) => props.$nothingChosenYet ? css`
    background-color: rgba(255, 254, 171, 1);
    color: rgba(0, 0, 0, 0.75);
  ` : ``}
`;


export const SelectRecipeToLoadView = observer( ({
  state,
  defaultOptionLabel = "secret from ..."
}: {
  state: RecipeBuilderState,
  defaultOptionLabel?: string
}) => {
  const savedRecipes = RecipeStore.storedRecipes;
  // Remove any saved recipes from the set of built-in recipes
  const builtInRecipes = BuiltInRecipes.filter(
    builtInRecipe => savedRecipes.every( savedRecipe =>
      builtInRecipe.recipeJson != savedRecipe.recipeJson ||
      builtInRecipe.type != savedRecipe.type
    )
  )
  return (
    <SelectRecipe $nothingChosenYet={!state.recipeIdentifier}
      value=""
//      placeholder={"Placeholder"}
      onChange={ (e) => {
        state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        state.setFieldInFocus(undefined);
        if (e.currentTarget.value !=  null) {
          e.currentTarget.value;
        }
      }}
    >
      <option key="none" disabled={true} hidden={true} value="">{defaultOptionLabel}</option>
      {savedRecipes.length == 0 ? (<></>) : (
        <optgroup key={"Saved Recipes"} label={"use a saved recipe"}>
          { savedRecipes.map( savedRecipe => {
            const id = savedRecipeIdentifier(savedRecipe);
            return (
              <option key={ id } value={ id } >{ enhancedStoredRecipeName(savedRecipe) }</option>
            )
          })}
        </optgroup>
      )}
      <optgroup key={"Built-in recipes"} label={"use a built-in recipe"}>
        { builtInRecipes.map( template => (
          <option key={template.name} value={builtInRecipeIdentifier(template)} >{ enhancedStoredRecipeName(template) }</option>
        ))}
      </optgroup>
      <optgroup key={"Custom"} label={"create a new recipe for a:"}>
        { DerivableObjectNameList.map( (recipeType) => (
          <option key={ recipeType } value={ customRecipeIdentifier({type: recipeType}) } >{ describeRecipeType(recipeType) }</option>
        ))}
      </optgroup>
    </SelectRecipe>
  );
});



export const CreateANewRecipeOfTypeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
    <>
    <label>Create a recipe for a new:</label>
    <SelectRecipe
      $nothingChosenYet={!state.recipeIdentifier}
      //      placeholder={"Placeholder"}
      onChange={ (e) => {
        state.loadRecipe(getStoredRecipe(e.currentTarget.value));
      }}
    >
      <option key="none" value="">...</option>
      { DerivableObjectNameList.map( (recipeType) => (
          <option key={ recipeType } value={ customRecipeIdentifier({type: recipeType}) } >{ describeRecipeType(recipeType) }</option>
      ))}      
    </SelectRecipe>
    </>
  );
});


export const LoadBuiltInRecipeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  const savedRecipes = RecipeStore.storedRecipes;
  // Remove any saved recipes from the set of built-in recipes
  const builtInRecipes = BuiltInRecipes.filter(
    builtInRecipe => savedRecipes.every( savedRecipe =>
      builtInRecipe.recipeJson != savedRecipe.recipeJson ||
      builtInRecipe.type != savedRecipe.type  ||
      builtInRecipe.name != savedRecipe.name
    )
  )
  return (
    <div>
      <label>Load built-in recipe:</label>
      <SelectRecipe $nothingChosenYet={!state.recipeIdentifier}
  //      placeholder={"Placeholder"}
        onChange={ (e) => {
          state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        }}
      >
      <option key="none" value="">...</option>
        { builtInRecipes.map( template => (
          <option key={template.name} value={builtInRecipeIdentifier(template)} >{ enhancedStoredRecipeName(template) }</option>
        ))}
      </SelectRecipe>
    </div>
  );
});

export const LoadSavedRecipeView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  const savedRecipes = RecipeStore.storedRecipes;
  if (savedRecipes.length === 0) return null;
  return (
    <div>
      <label>Load saved recipe:</label>
      <SelectRecipe $nothingChosenYet={!state.recipeIdentifier}
        title="Load saved recipe"
//        placeholder={"Placeholder"}
        onChange={ (e) => {
          state.loadRecipe(getStoredRecipe(e.currentTarget.value));
        }}
      >
        <option key="none" value="">...</option>
        {savedRecipes.map( savedRecipe => (
              <option key={ savedRecipe.name } value={ savedRecipeIdentifier(savedRecipe)} >{ enhancedStoredRecipeName(savedRecipe) }</option>
            ))}
      </SelectRecipe>
    </div>
  );
});

const LoadRecipeViewDiv = styled.div`
  margin: 0.25rem;
`;

export const LoadRecipeView = ({state}: {
  state: RecipeBuilderState,
}) => (
    <LoadRecipeViewDiv>
      (Re)create a &nbsp;
      <SelectRecipeToLoadView {...{state}} />
    </LoadRecipeViewDiv>
);