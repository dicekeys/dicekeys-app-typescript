import React from "react";
import { observer, Observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode } from "../RecipeBuilderState";
import { DiceKey } from "../../../dicekeys/DiceKey";
import { DiceKeyViewAutoSized } from "../../../views/SVG/DiceKeyView";
import { ToggleState } from "../../../state";
import { HoverState } from "../../../state/reusable/HoverState";
import { visibility } from "../../../utilities/visibility";
import { RecipeDescriptionContentView, RecipePurposeContentView } from "../RecipeDescriptionView";
import { MultilineRecipeJsonView } from "./MultilineRecipeView";
import * as Dimensions from "./Dimensions";
import styled from "styled-components";

type RecipeRibbonButtons = "SaveOrDelete" | "Increment" | "Decrement" | "EditFields" | "EditRawJson" | "RemoveRecipe";

const RecipeEditStateButton = styled.button<{$selected?: boolean; invisible?: boolean}>`
  border: none;;
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
  visibility: ${(p)=>p.invisible ? "hidden" : "visible"};
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
  width: ${Dimensions.ContentWidthInVw}vw;
`;

const EditButtonHoverTextInnerContainer = styled.div`
  position: absolute;
  bottom: 0;
  right: 0;
  width: ${Dimensions.recipeViewWidthCalculated};
  text-align: right;
  font-size:0.9rem
`;

const EditButtonHoverTextView = ({
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
              (<>Delete from saved recipe list</>) :
              (<>Save this recipe locally</>)
            case "Increment":
              return recipeBuilderState.sequenceNumber! > 1 ?
                (<>Increment the sequence number to change the {recipeBuilderState.typeNameLc}</>):
                (<>Add a sequence number to create a different {recipeBuilderState.typeNameLc}
                    <RecipePurposeContentView recipe={recipeBuilderState.recipe} /></>);
            case "Decrement":
              return recipeBuilderState.sequenceNumber! > 2 ?
                (<>Decrement the sequence number</>) :
                recipeBuilderState.sequenceNumber! == 2 ?
                  (<>Remove the sequence number</>) :
                  (<>&nbsp;</>);
            case "EditFields":
              return (<>Edit the fields of this recipe</>);
            case "EditRawJson":
              return (<>Edit this recipe&apos;s raw JSON.</>);
            case "RemoveRecipe":
              // FIXME -- if saved "Close" otherwise "Discard"
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
  // With buttons in a row from right to left in the box
  display: flex;
  flex-direction: row;
  align-items: flex-start;
`;

const RecipeRibbonButtons = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<RecipeRibbonButtons>
}) => (
  <RecipeButtonRibbon>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete || recipeBuilderState.sequenceNumber == null}
      {...editButtonsHoverState.hoverStateActions("Decrement")}
      onClick={recipeBuilderState.sequenceNumberState.decrement}>-</RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
      {...editButtonsHoverState.hoverStateActions("Increment")}
      onClick={recipeBuilderState.sequenceNumberState.increment}>+</RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
      {...editButtonsHoverState.hoverStateActions("EditFields")}
      $selected={recipeBuilderState.editingMode === RecipeEditingMode.EditWithTemplateOnly}
      onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditWithTemplateOnly);}}>
        <span style={{textDecoration: "underline"}}>&nbsp;&#9998;&nbsp;</span></RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
      {...editButtonsHoverState.hoverStateActions("EditRawJson")}
      $selected={recipeBuilderState.editingMode === RecipeEditingMode.EditIncludingRawJson}
      onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditIncludingRawJson);}
    }>{`{`}&#9998;{`}`}</RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
      // Adjust sizing so that Save/Delete take equal space
      style={{minWidth: `7rem`}}
      {...editButtonsHoverState.hoverStateActions("SaveOrDelete")}
        onClick={recipeBuilderState.saveOrDelete}>
        { recipeBuilderState.savedRecipeIdentifier == null ? (<>save</>): (<>delete</>) }
      </RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
      {...editButtonsHoverState.hoverStateActions("RemoveRecipe")}
      onClick={()=>{recipeBuilderState.emptyAllRecipeFields()}}
    >&#x2715;</RecipeEditStateButton>
  </RecipeButtonRibbon>
));

const RecipeViewContainer = styled.div`
  display: flex;
  flex-direction:column;
`;

const RecipeViewRoundedRect = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: flex-start;
  background-color: rgba(128,128,196,0.10);
  padding: ${Dimensions.BoxPadding};
  width: ${Dimensions.recipeViewWidthCalculated};
  min-height: calc(${Dimensions.DiceKeyBoxSize} - 2 * (${Dimensions.BoxPadding}));
  border-radius: ${Dimensions.BoxPadding};
  color: rgba(0, 0, 0, 1);
`;

const InteriorLabelForRecipe = styled.div`
  font-size: ${Dimensions.LabelFontSizeVh}vh;
  font-family: sans-serif;
  margin-left: 1rem;
  color: rgba(0,0,0,0.5);
`;

const RecipeSeparator = styled.div`
  min-height: "0.5vh";
  width: calc(${Dimensions.recipeViewWidthFormula } - 0.7rem);
  border-bottom: 1px solid rgba(0,0,0,0.1);
`;

const RecipeView = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<RecipeRibbonButtons>
}) => (
  <RecipeViewContainer>
    <RecipeRibbonButtons {...{recipeBuilderState, editButtonsHoverState}} />
    <RecipeViewRoundedRect>
      { !recipeBuilderState.recipeIsNotEmpty ? (
        <InteriorLabelForRecipe>Recipe</InteriorLabelForRecipe>
      ) : (
        <>
          <MultilineRecipeJsonView recipeJson={ recipeBuilderState.recipeJson  }/>
          <RecipeSeparator/>
          <div>
            <RecipeDescriptionContentView state={recipeBuilderState} />
          </div>  
        </>
      ) }
    </RecipeViewRoundedRect>
  </RecipeViewContainer>
));



export const KeyPlusRecipeView = observer ( ( {diceKey, recipeBuilderState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState
}) => {
  const editButtonsHoverState = new HoverState<RecipeRibbonButtons>();
  return (
  <>
  {/* Width: 90% (max): [22.5vw (max) for key] + [5vw for + sign] + [62.5vw] for recipe */}
    <EditButtonHoverTextView {...{editButtonsHoverState, recipeBuilderState}}/>
    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
      <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
        {/* Key */}
        <span style={{width: Dimensions.DiceKeyBoxSize, height: Dimensions.DiceKeyBoxSize}}>
          <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight={Dimensions.diceKeyBoxMaxHeight} maxWidth={Dimensions.DiceKeyBoxMaxWidth}
            obscureAllButCenterDie={ToggleState.ObscureDiceKey}
          />
        </span>
        {/* Plus sign */}
        <span style={{width: Dimensions.PlusSignViewWidth, textAlign: "center", fontSize: `${Dimensions.DownArrowAndPlusSignViewHeight}vh`}}>+</span>
        <RecipeView {...{recipeBuilderState, editButtonsHoverState}} />
      </div>
      <div style={{display: "flex", flexDirection: "row", alignItems: "flex-start"}}>
        <div style={{display: "flex", fontFamily: "sans-serif", fontSize: `${Dimensions.LabelFontSizeVh}vh`, flexDirection: "row", width: Dimensions.DiceKeyBoxSize, justifyContent: "center", alignItems: "baseline", color: "rgba(0, 0, 0, 0.5)"}}>
          Key
        </div>
        <div style={{
          width: Dimensions.PlusSignViewWidth, textAlign: "center",
          paddingBottom: `${0.15 * Dimensions.DownArrowAndPlusSignViewHeight}vh`,
          fontSize: `${Dimensions.DownArrowAndPlusSignViewHeight}vh`,
          height: `${Dimensions.DownArrowAndPlusSignViewHeight}vh`,
        }}>&#8659;
        </div>
        <div style={{width: Dimensions.recipeViewWidthCalculated, fontFamily: "sans-serif", fontSize: "3vh", textAlign: "center", color: "rgba(0, 0, 0, 0.5)",
          ...visibility(recipeBuilderState.recipeIsNotEmpty)
        }}>
          Recipe
        </div>
      </div>
    </div>
  </>
)});
