import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderView } from ".";
import { RecipeBuilderState, RecipeEditingMode } from "./RecipeBuilderState";
import { SelectRecipeToLoadView } from "./LoadRecipeView";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { ContentBox, Spacer } from "../basics";
import { DiceKeyViewAutoSized } from "../../views/SVG/DiceKeyView";
import { ToggleState } from "../../state";
import { MultilineRecipeView } from "./MultilineRecipeView";
import { RecipeDescriptionContentView } from "./RecipeDescriptionView";
import { HoverState } from "../../state/reusable/HoverState";

interface DerivationViewProps {
  diceKey: DiceKey;
}

/**
 *  [Add|Edit] sequence number  (sets to 2 if not set, if changed to 1 while in this mode, go back to no sequence number)
 *  Edit all fields (current editor)
 *  Edit raw JSON
 *  
 * 
 *    - +     sequence number
 *    pencil  edit raw fields 
 *    {}  edit raw json
 * 
 */




const RecipeEditStateButton = observer( ({selected, children, ...buttonArgs}: {
  selected?: boolean,
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => 
  <button {...buttonArgs}
    className={selected ? css.RecipeEditorButtonActive : css.RecipeEditorButton}
  >{children}</button>
);

type EditButtons = "Increment" | "Decrement" | "EditFields" | "EditRawJson";

export const DerivationViewWithState = observer( ( {
  diceKey, recipeBuilderState, derivedFromRecipeState, editButtonsHoverState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState,
  derivedFromRecipeState: DerivedFromRecipeState,
  editButtonsHoverState: HoverState<EditButtons>
}) => (
  <ContentBox>
    {/* <LoadRecipeView state={recipeBuilderState} /> */}
    <Spacer/>
    <div>{editButtonsHoverState.state ?? "no hover state"}</div>
    <div className={css.DerivationView}>
      <RecipeBuilderView state={recipeBuilderState} />
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          {/* Key */}
          <span style={{width: "min(22.5vh, 25vw)", height: "min(22.5vh, 25vw)"}}>
            <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight="22.5vh" maxWidth="25vw"
              obscureAllButCenterDie={ToggleState.ObscureDiceKey}
            />
          </span>
          {/* Plus sign */}
          <span style={{width: "5vw", textAlign: "center", fontSize:"3vw"}}>+</span>
          {/* Recipe */}
          <div style={{display: "flex", flexDirection:"column"}}>
            <div style={{
                position: "absolute",
                marginRight: "0.5rem",
                justifySelf: "flex-start",
                alignSelf: "flex-end",
                // backgroundColor: "green",
                borderBottomLeftRadius: "0.25rem",
                borderBottomRightRadius: "0.25rem",
                paddingLeft: "0.5rem",
                paddingRight: "0.5rem",
                paddingBottom: "0.25rem",
                zIndex: 1,
                display: "flex",
                flexDirection: "row",
                alignItems: "flex-start"
            }}>
              <RecipeEditStateButton
                {...editButtonsHoverState.hoverStateActions("Decrement")}
                onClick={recipeBuilderState.sequenceNumberState.decrement}>-</RecipeEditStateButton>
              <RecipeEditStateButton
                {...editButtonsHoverState.hoverStateActions("Increment")}
                onClick={recipeBuilderState.sequenceNumberState.increment}>+</RecipeEditStateButton>
              <RecipeEditStateButton
                {...editButtonsHoverState.hoverStateActions("EditFields")}
                selected={recipeBuilderState.editingMode === RecipeEditingMode.EditWithTemplateOnly}
                onClick={()=>{recipeBuilderState.setEditingMode(RecipeEditingMode.EditWithTemplateOnly);}} style={{textDecoration: "underline"}}>&nbsp;&#9998;&nbsp;</RecipeEditStateButton>
              <RecipeEditStateButton
                {...editButtonsHoverState.hoverStateActions("EditRawJson")}
                selected={recipeBuilderState.editingMode === RecipeEditingMode.EditIncludingRawJson}
                onClick={()=>{recipeBuilderState.setEditingMode(RecipeEditingMode.EditIncludingRawJson);}
              }>{`{`}&#9998;{`}`}</RecipeEditStateButton>
              {/* <select style={{
              border: "none"
            }}><option>edit</option></select> */}
            </div>
          <div style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "flex-start",
            width: "calc(60vw - 0.7rem)",
            backgroundColor: "rgba(128,128,196,0.10)",
            padding: "0.35rem",
            borderRadius: "0.35rem",
            color: "rgba(0, 0, 0, 1)",
            minHeight: "calc(min(22.5vh, 25vw) - 0.7rem)",
          }}>
            <MultilineRecipeView state={recipeBuilderState} />
            { recipeBuilderState.recipeJson == null ? null : (
              <div style={{minHeight: "0.5vw", width: "calc(60vw - 0.7rem)", borderBottom: "1px solid rgba(0,0,0,0.1)"}}></div>
            )}
            <div>
              <RecipeDescriptionContentView state={recipeBuilderState} />
            </div>
          </div>
        </div></div>
        <div style={{display: "flex", flexDirection: "row", alignItems: "flex-start"}}>
          <div style={{display: "flex", fontFamily: "sans-serif", fontSize: "1rem", flexDirection: "row", width: "min(22.5vh, 25vw)", justifyContent: "center", alignItems: "baseline", color: "rgba(0, 0, 0, 0.5)"}}>
            Key
          </div>
          <div style={{width: "5vw", textAlign: "center", fontSize: "3vw", paddingTop: "0.2vh"}}>
            &#8659;
          </div>
          <div style={{width: "60vw", fontFamily: "sans-serif", fontSize: "1rem", textAlign: "center", color: "rgba(0, 0, 0, 0.5)"}}>
            Recipe to (re)create a <SelectRecipeToLoadView state={recipeBuilderState} />
          </div>
        </div>
        {/* <div style={{width: "5vw", paddingLeft:"min(22.5vh, 25vw)", textAlign: "center", fontSize: "3vw"}}>
          &#8659;
        </div> */}
      </div>
      <DerivedFromRecipeView state={derivedFromRecipeState} />
    </div>
    <Spacer/>
  </ContentBox>
));
export const DerivationView = observer ( (props: DerivationViewProps) => {
  const {diceKey} = props;
  const seedString = diceKey.toSeedString();
  const recipeBuilderState =  new RecipeBuilderState();
  const derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, seedString});
  const editButtonsHoverState = new HoverState<EditButtons>();
  return (
    <DerivationViewWithState {...{diceKey, recipeBuilderState, derivedFromRecipeState, editButtonsHoverState}}/>
  )
});

export const Preview_DerivationView = () => (
  <DerivationView diceKey={DiceKey.testExample} />
)
