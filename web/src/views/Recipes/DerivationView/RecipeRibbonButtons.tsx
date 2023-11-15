import React from "react";
import { observer, Observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode } from "../RecipeBuilderState";
import { HoverState } from "../../../state/reusable/HoverState";
import { RecipePurposeContentView } from "../RecipeDescriptionView";
import * as Dimensions from "./DerivationViewLayout";
import styled from "styled-components";
import { cssCalcTyped } from "../../../utilities";

export type RecipeRibbonButtons = "SaveOrDelete" | "Increment" | "Decrement" | "EditFields" | "EditRawJson" | "RemoveRecipe";

const RecipeEditStateButton = styled.button<{$selected?: boolean; $invisible?: boolean}>`
  border: none;
  margin-top: 0px;
  padding-top: 0px;
  margin-right: 0.2rem;
  margin-left: 0px;
  border-top-left-radius: 0px;
  border-top-right-radius: 0px;
  border-bottom-left-radius: 0.5rem;
  border-bottom-right-radius: 0.5rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  min-width: 2rem;
  height: 1.5rem;
  vertical-align: middle;
  visibility: ${(p)=>p.$invisible ? "hidden" : "visible"};
  background-color: ${(p) => p.$selected ?
    `rgba(128, 128, 128, 0.666)` :
    `rgba(255, 255, 255, 0.666)`
  };

  &:hover {
    background-color: rgba(128, 128, 128, 0.5);
  }
`;

const EditButtonHoverTextOuterContainer = styled.div`
  display: block;
  position: relative;
  user-select: none;
  width: ${cssCalcTyped(Dimensions.ContentWidth)};
`;

const EditButtonHoverTextInnerContainer = styled.div`
  position: absolute;
  user-select: none;
  bottom: 0;
  right: 0;
  width: ${cssCalcTyped(Dimensions.ContentWidth)};
  text-align: right;
  font-size:0.9rem
`;

export const EditButtonHoverTextView = ({
  editButtonsHoverState, recipeBuilderState
}: {
  editButtonsHoverState: HoverState<RecipeRibbonButtons>,
  recipeBuilderState: RecipeBuilderState,
}) => (
  <EditButtonHoverTextOuterContainer>
    <EditButtonHoverTextInnerContainer>
      <Observer>{ (): React.ReactElement => {
          switch(editButtonsHoverState.state) {
            case "SaveOrDelete":
              return recipeBuilderState.savedRecipeIdentifier != null ?
              (<>Delete from saved recipe list.</>) :
              (<>Save this recipe locally.</>)
            case "Increment":
              return recipeBuilderState.sequenceNumberOrDefault > 1 ?
                (<>Increment the sequence number to change the {recipeBuilderState.typeNameLc}.</>):
                (<>Add a sequence number to create a different {recipeBuilderState.typeNameLc}
                    <RecipePurposeContentView recipe={recipeBuilderState.recipe} />.</>);
            case "Decrement":
              return recipeBuilderState.sequenceNumberOrDefault > 2 ?
                (<>Decrement the sequence number</>) :
                recipeBuilderState.sequenceNumberOrDefault == 2 ?
                  (<>Remove the sequence number.</>) :
                  (<>&nbsp;</>);
            case "EditFields":
              return (<>Edit the fields of this recipe.</>);
            case "EditRawJson":
              return (<>Edit this recipe&apos;s raw JSON.</>);
            case "RemoveRecipe":
              return (<>Close this recipe and start over.</>);
              default: return (<>&nbsp;</>);
          } // end switch
        // end fn and call it to return the string
      }}</Observer>
    </EditButtonHoverTextInnerContainer>
  </EditButtonHoverTextOuterContainer>
);

const RecipeButtonRibbon = styled.div`
  // Absolute positioned touching the top
  position: absolute;
  z-index: 1;
  user-select: none;
  margin-right: 0.5rem;
  // offset close to the right edge
  align-self: flex-end;
  justify-self: flex-start;
  // With round-cornered padding on the bottom
  border-bottom-left-radius: 0.25rem;
  border-bottom-right-radius: 0.25rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  padding-bottom: 0.25rem;
  cursor: grab;
  // With buttons in a row from right to left in the box
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

export const RecipeRibbonButtonsView = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<RecipeRibbonButtons>,
}) => {
  return (
    <RecipeButtonRibbon>
      <RecipeEditStateButton
        $invisible={!recipeBuilderState.wizardComplete || recipeBuilderState.sequenceNumber == null}
        {...editButtonsHoverState.hoverStateActions("Decrement")}
        onClick={recipeBuilderState.sequenceNumberState.decrement}>-</RecipeEditStateButton>
      <RecipeEditStateButton
        $invisible={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("Increment")}
        onClick={recipeBuilderState.sequenceNumberState.increment}>+</RecipeEditStateButton>
      <RecipeEditStateButton
        $invisible={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("EditFields")}
        $selected={recipeBuilderState.editingMode === RecipeEditingMode.EditWithTemplateOnly}
        onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditWithTemplateOnly);}}>
          <span style={{textDecoration: "underline"}}>&nbsp;&#9998;&nbsp;</span></RecipeEditStateButton>
      <RecipeEditStateButton
        $invisible={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("EditRawJson")}
        $selected={recipeBuilderState.editingMode === RecipeEditingMode.EditIncludingRawJson}
        onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditIncludingRawJson);}
      }>{`{`}&#9998;{`}`}</RecipeEditStateButton>
      <RecipeEditStateButton
        $invisible={!recipeBuilderState.wizardComplete}
        // Adjust sizing so that Save/Delete take equal space
        style={{minWidth: `7rem`}}
        {...editButtonsHoverState.hoverStateActions("SaveOrDelete")}
          onClick={recipeBuilderState.saveOrDelete}>
          { recipeBuilderState.savedRecipeIdentifier == null ? (<>save</>): (<>delete</>) }
        </RecipeEditStateButton>
      <RecipeEditStateButton
        $invisible={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("RemoveRecipe")}
        onClick={()=>{recipeBuilderState.emptyAllRecipeFields()}}
      >&#x2715;</RecipeEditStateButton>
    </RecipeButtonRibbon>
  )
});
