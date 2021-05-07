import css from "./RecipeBuilderView.css";
import React from "react";
import { observer  } from "mobx-react";
import { DerivationRecipeType } from "../../dicekeys/SavedRecipe";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivableObjectNameList, describeRecipeType } from "./DescribeRecipeType";


export const RecipeTypeSelectorView = observer( ({state}: {
  state: RecipeBuilderState,
}) => {
  return (
    <div style={{display: "flex", alignSelf: "flex-start", flexDirection: "row", justifyContent: "flex-start"}}>
      Derive a&nbsp;
      <select
        className={css.SelectRecipe}
        value={ state.type ?? "" }
        onMouseEnter={state.showHelpForFn(undefined)}
        onChange={ (e) => {
          state.setType(e.currentTarget.value as DerivationRecipeType | undefined);
          state.showHelpFor(undefined);
        }}
      >
        <option key="none" disabled={true} hidden={true} value="">...</option>
        { DerivableObjectNameList.map( (recipeType) => (
          <option key={ recipeType } value={ recipeType } >{ describeRecipeType(recipeType) }</option>
        ))}              
      </select>
    </div>
  );
});