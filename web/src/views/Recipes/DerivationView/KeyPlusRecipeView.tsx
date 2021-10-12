import React from "react";
import { observer  } from "mobx-react";
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

const EditButtonHoverTextView = observer(
  ({editButtonsHoverState, recipeBuilderState}: {
    editButtonsHoverState: HoverState<RecipeRibbonButtons>,
    recipeBuilderState: RecipeBuilderState,
  }) => {
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
        (<>Remove the sequence number</>) : (<>&nbsp;</>);
      case "EditFields":
        return (<>Edit the fields of this recipe</>)
      case "EditRawJson":
        return (<>Edit this recipe's raw JSON.</>)
      case "RemoveRecipe":
        // FIXME -- if saved "Close" otherwise "Discard"
        return (<>Close this recipe and start over.</>)
        default: return (<>&nbsp;</>);
    }
});


const RecipeRibbonButtons = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<RecipeRibbonButtons>
}) => (
  <div style={{
    // Absolute positioned touching the top
    position: "absolute",
    zIndex: 1,
    marginRight: "0.5rem",
    // offset close to the right edge
    alignSelf: "flex-end",
    justifySelf: "flex-start",
    // With round-cornered padding on the bottom
    borderBottomLeftRadius: "0.25rem",
    borderBottomRightRadius: "0.25rem",
    paddingLeft: "0.5rem",
    paddingRight: "0.5rem",
    paddingBottom: "0.25rem",
    // With buttons in a row from right to left in the box
    display: "flex",
    flexDirection: "row",
    alignItems: "flex-start"
  }}>
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
      style={{textDecoration: "underline"}}
      {...editButtonsHoverState.hoverStateActions("EditFields")}
      $selected={recipeBuilderState.editingMode === RecipeEditingMode.EditWithTemplateOnly}
      onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditWithTemplateOnly);}}>&nbsp;&#9998;&nbsp;</RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
      {...editButtonsHoverState.hoverStateActions("EditRawJson")}
      $selected={recipeBuilderState.editingMode === RecipeEditingMode.EditIncludingRawJson}
      onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditIncludingRawJson);}
    }>{`{`}&#9998;{`}`}</RecipeEditStateButton>
    <RecipeEditStateButton
      invisible={!recipeBuilderState.wizardComplete}
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
  </div>
));

const RecipeView = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<RecipeRibbonButtons>
}) => (
  <div style={{display: "flex", flexDirection:"column"}}>
    <RecipeRibbonButtons {...{recipeBuilderState, editButtonsHoverState}} />
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
      alignItems: "flex-start",
      backgroundColor: "rgba(128,128,196,0.10)",
      padding: Dimensions.BoxPadding,
      width: Dimensions.recipeViewWidthCalculated,
      minHeight: `calc(${Dimensions.DiceKeyBoxSize} - 2 * (${Dimensions.BoxPadding}))`,
      borderRadius: Dimensions.BoxPadding,
      color: "rgba(0, 0, 0, 1)",
    }}>
      { !recipeBuilderState.recipeIsNotEmpty ? (
        <div style={{
          fontSize: `${Dimensions.LabelFontSizeVh}vh`,
          fontFamily: "sans-serif",
          marginLeft: "1rem",
          color: "rgba(0,0,0,0.5)",
        }}>Recipe</div>
      ) : (
        <>
          <MultilineRecipeJsonView recipeJson={ recipeBuilderState.recipeJson  }/>
          { recipeBuilderState.recipeJson == null ? null : (
            <div style={{minHeight: "0.5vh", width: `calc(${Dimensions.recipeViewWidthFormula } - 0.7rem)`, borderBottom: "1px solid rgba(0,0,0,0.1)"}}></div>
          )}
          <div>
            <RecipeDescriptionContentView state={recipeBuilderState} />
          </div>  
        </>
      ) }
    </div>
  </div>
))


export const KeyPlusRecipeView = observer ( ( {diceKey, recipeBuilderState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState
}) => {
  const editButtonsHoverState = new HoverState<RecipeRibbonButtons>();
  return (
  <>
  {/* Width: 90% (max): [22.5vw (max) for key] + [5vw for + sign] + [62.5vw] for recipe */}
    <div style={{display: "block", position: "relative",
      width: `${Dimensions.ScreenWidthPercentUsed}vw`,
    }}>
      <div style={{position: "absolute", bottom: 0, right: 0, width: `${Dimensions.recipeViewWidthCalculated}vw`,
        textAlign: 'right',
        fontSize:"0.9rem"}}><EditButtonHoverTextView {...{editButtonsHoverState, recipeBuilderState}}/></div>
    </div>
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
