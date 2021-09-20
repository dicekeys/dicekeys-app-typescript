import React from "react";
import css from "../Recipes.module.css";
import { observer  } from "mobx-react";
import { RecipeBuilderState, RecipeEditingMode, WizardStep } from "../RecipeBuilderState";
import { DiceKey } from "../../../dicekeys/DiceKey";
import { DiceKeyViewAutoSized } from "../../../views/SVG/DiceKeyView";
import { ToggleState } from "../../../state";
import { HoverState } from "../../../state/reusable/HoverState";
import { visibility } from "../../../utilities/visibility";
import { RecipeDescriptionContentView, RecipePurposeContentView } from "../RecipeDescriptionView";
import { MultilineRecipeJsonView } from "./MultilineRecipeView";
import * as Dimensions from "./Dimensions";

type EditButtons = "Increment" | "Decrement" | "EditFields" | "EditRawJson" | "RemoveRecipe";

const EditButtonHoverTextView = observer(
  ({editButtonsHoverState, recipeBuilderState}: {
    editButtonsHoverState: HoverState<EditButtons>,
    recipeBuilderState: RecipeBuilderState,
  }) => {
    switch(editButtonsHoverState.state) {
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
        return (<>Discard this recipe and start over.</>)
        default: return (<>&nbsp;</>);
    }
});

const RecipeEditStateButton = observer( ({selected, children, ...buttonArgs}: {
  selected?: boolean,
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => 
  <button {...buttonArgs}
    className={selected ? css.RecipeEditorButtonActive : css.RecipeEditorButton}
  >{children}</button>
);


const RecipeView = observer( ({recipeBuilderState, editButtonsHoverState}: {
  recipeBuilderState: RecipeBuilderState,
  editButtonsHoverState: HoverState<EditButtons>
}) => (
  <div style={{display: "flex", flexDirection:"column"}}>
    {/* Ribbon buttons */}
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
        hidden={!recipeBuilderState.wizardComplete || recipeBuilderState.sequenceNumber == null}
        {...editButtonsHoverState.hoverStateActions("Decrement")}
        onClick={recipeBuilderState.sequenceNumberState.decrement}>-</RecipeEditStateButton>
      <RecipeEditStateButton
        hidden={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("Increment")}
        onClick={recipeBuilderState.sequenceNumberState.increment}>+</RecipeEditStateButton>
      <RecipeEditStateButton
        hidden={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("EditFields")}
        selected={recipeBuilderState.editingMode === RecipeEditingMode.EditWithTemplateOnly}
        onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditWithTemplateOnly);}} style={{textDecoration: "underline"}}>&nbsp;&#9998;&nbsp;</RecipeEditStateButton>
      <RecipeEditStateButton
        hidden={!recipeBuilderState.wizardComplete}
        {...editButtonsHoverState.hoverStateActions("EditRawJson")}
        selected={recipeBuilderState.editingMode === RecipeEditingMode.EditIncludingRawJson}
        onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditIncludingRawJson);}
      }>{`{`}&#9998;{`}`}</RecipeEditStateButton>
      <button className={css.RecipeEditorButton}
        hidden={recipeBuilderState.wizardStep === WizardStep.PickRecipe}
        {...editButtonsHoverState.hoverStateActions("RemoveRecipe")}
        onClick={()=>{recipeBuilderState.emptyAllRecipeFields()}}
      >&#x2715;</button>
    </div>
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
      alignItems: "flex-start",
      backgroundColor: "rgba(128,128,196,0.10)",
      padding: "0.35rem",
      // External width is 60% of the screen (60vw), with 0.7rem lost to padding (0.35rem on each side)
      width: "calc(60vw - 0.7rem)",
      // Min external height is the lesser of 22.5% of the window height or 25% of the window width,
      // with 0.7rem removed for padding
      minHeight: `calc(${Dimensions.diceKeyBoxSize} - 0.7rem)`,
      borderRadius: "0.35rem",
      color: "rgba(0, 0, 0, 1)",
    }}>
      { !recipeBuilderState.wizardComplete ? (
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
            <div style={{minHeight: "0.5vh", width: "calc(60vw - 0.7rem)", borderBottom: "1px solid rgba(0,0,0,0.1)"}}></div>
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
  const editButtonsHoverState = new HoverState<EditButtons>();
  return (
  <>
  {/* Width: 90% (max): [22.5vw (max) for key] + [5vw for + sign] + [62.5vw] for recipe */}
    <div style={{alignSelf: "flex-end", fontSize:"0.9rem"}}><EditButtonHoverTextView {...{editButtonsHoverState, recipeBuilderState}}/></div>
    <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
      <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
        {/* Key */}
        <span style={{width: Dimensions.diceKeyBoxSize, height: Dimensions.diceKeyBoxSize}}>
          <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight={Dimensions.diceKeyBoxMaxHeight} maxWidth={Dimensions.diceKeyBoxMaxWidth}
            obscureAllButCenterDie={ToggleState.ObscureDiceKey}
          />
        </span>
        {/* Plus sign */}
        <span style={{width: Dimensions.plusSignViewWidth, textAlign: "center", fontSize: `${Dimensions.DownArrowAndPlusSignViewHeight}vh`}}>+</span>
        <RecipeView {...{recipeBuilderState, editButtonsHoverState}} />
      </div>
      <div style={{display: "flex", flexDirection: "row", alignItems: "flex-start"}}>
        <div style={{display: "flex", fontFamily: "sans-serif", fontSize: `${Dimensions.LabelFontSizeVh}vh`, flexDirection: "row", width: Dimensions.diceKeyBoxSize, justifyContent: "center", alignItems: "baseline", color: "rgba(0, 0, 0, 0.5)"}}>
          Key
        </div>
        <div style={{width: Dimensions.plusSignViewWidth, textAlign: "center", fontSize: `${Dimensions.DownArrowAndPlusSignViewHeight}vh`, height: `${Dimensions.DownArrowAndPlusSignViewHeight}vh`, 
        }}>{
          true || recipeBuilderState.wizardStep > WizardStep.EnterAddressOrPurpose ? 
            // Down arrow
            (<>&#8659;</>) :
            null
        }
        </div>
        <div style={{width: Dimensions.recipeViewWidth, fontFamily: "sans-serif", fontSize: "3vh", textAlign: "center", color: "rgba(0, 0, 0, 0.5)",
          ...visibility(recipeBuilderState.wizardComplete)
        }}>
          Recipe
          {/* to (re)create a <SelectRecipeToLoadView state={recipeBuilderState} /> */}
        </div>
      </div>
    </div>
  </>
)});