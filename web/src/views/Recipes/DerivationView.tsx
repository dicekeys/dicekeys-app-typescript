import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
//import { RecipeBuilderView } from ".";
import { RecipeBuilderState, RecipeEditingMode, WizardStep } from "./RecipeBuilderState";
import { CreateANewRecipeOfTypeView, LoadBuiltInRecipeView, LoadSavedRecipeView, SelectRecipeToLoadView } from "./LoadRecipeView";
import { DiceKey } from "../../dicekeys/DiceKey";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { ContentBox, Spacer } from "../basics";
import { DiceKeyViewAutoSized } from "../../views/SVG/DiceKeyView";
import { ToggleState } from "../../state";
import { MultilineRecipeJsonView } from "./MultilineRecipeView";
import { RecipeDescriptionContentView, RecipePurposeContentView } from "./RecipeDescriptionView";
import { HoverState } from "../../state/reusable/HoverState";
import { RecipeBuilderView } from "./RecipeBuilderView";
import { visibility } from "../../utilities/visibility";
//import { visibility } from "../../utilities/visibility";

interface DerivationViewProps {
  diceKey: DiceKey;
}

// Apply a _recipe_ to your DiceKey to create a password, key, or other secret
//   

/**
 * 
 * Step 0:
//  *    Create a secret from:
//  *      Re-create a secret from a saved recipe
//  *        [list]
//  *      Create a new secret from a built-in recipe
// *         [list]
//  *      Create a new secret without a built-in-recipe
//  *        [secret type]
 * 
 * Step 1:
 *    Recipe type determined, but 
 *    Is this {recipeBuilderState.typeNameLc} for a website or service with a web address?
 *      [yes]  [no]
 * 
 *    [Skip these steps and let me enter a raw recipe string]
 *
 * Step 2:
 *    Choose purpose or domain
 * 
 * Step 3:
 *    Editor turns on and other fields appear
 * 
 * Step 4:
 *    Raw JSON activated?
 *
 * Is this <x> for a web page or service with a web address? (default yes for password)
 * Paste the web page's link from your browser's address bar or enter the domain name (e.g., https://example.com or just example.com).
 *     set declined flag
 * For site:
 * For purpose:

* Unique purpose
 * 
 * List fields vertically
 * 
 * Optional fields: put in explanation and use "add" button
 *    [add] to limit the number of characters
 *    [add] to set change the length of the secret (current 32 bytes)
 *    [add] a sequence number if you need another []
 *
 * 
 */


const InlineButton = observer( ({selected, children, ...buttonArgs}: {
  selected?: boolean,
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => 
  <button {...buttonArgs}
    className={selected ? css.RecipeEditorButtonActive : css.RecipeEditorButton}
  >{children}</button>
);

export const DomainOrPurposeQuestionView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (<div style={{fontSize: "1.25rem"}}>
      Is this {state.typeNameLc} for a website or application with a web address (URL)?
      <InlineButton
        selected={state.usePurposeOrAllow === "allow"}
        onClick={state.setUsePurposeOrAllowFn("allow")}
      >yes</InlineButton>
      <InlineButton
        selected={state.usePurposeOrAllow === "purpose"}
        onClick={state.setUsePurposeOrAllowFn("purpose")}
      >no</InlineButton>
    </div>);
});

export const AssociatedDomainsTextFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  return (
    <input type="text"
      className={css.PurposeOrHostNameTextField}
      id={"AssociatedDomains"}
      spellCheck={false}
      size={40}
      value={state.associatedDomainsTextField ?? ""}
      placeholder="example.com"
      onInput={ e => {state.setAssociatedDomainsTextField(e.currentTarget.value); }} 
      onPaste={ state.pasteIntoAssociatedDomainsTextField }
      onKeyUp={ e => {if (e.key === "Enter" && (state.hosts?.length ?? 0) > 0) { 
        state.setPurposeOrAssociatedDomainsEntered(true);
      }}}

    />
  );
});

export const PurposeFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  return (
    <input type="text"
      className={css.PurposeOrHostNameTextField}
      id={"purpose"}
      spellCheck={false}
      size={40}
      value={state.purposeField ?? ""}
      placeholder=""
      onInput={ e => {state.setPurposeField(e.currentTarget.value); }}
      onKeyUp={ e => {if (e.key === "Enter" && e.currentTarget.value.length > 0) { 
        state.setPurposeOrAssociatedDomainsEntered(true);
      }}}
    />
  );
});

export const TextCompletionButton = ( {...attributes}: React.ButtonHTMLAttributes<HTMLButtonElement> = {}) => (
  <button {...attributes}>&#9166;</button>
);

export const PurposeOrAssociatedDomainsEnteredButton = ({state}: {
  state: RecipeBuilderState}) => (
  <TextCompletionButton onClick={state.setPurposeOrAssociatedDomainsEnteredFn(true)} />
);

export const WizardFieldLabel = observer ( ({...attributes}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    style={{minWidth: "10rem", marginRight: "1rem", textAlign: "right"}}
  >{attributes.children}</label>
) );

export const EnterAssociatedDomainsView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (<>
      Paste the address of the website or enter its domain name (e.g., https://example.com or just example.com)
      <div>
        <WizardFieldLabel>Domain:</WizardFieldLabel>
        <AssociatedDomainsTextFieldView { ...{state}} />
        <TextCompletionButton
          disabled={(state.hosts?.length ?? 0) === 0}
          onClick={state.setPurposeOrAssociatedDomainsEnteredFn(true)}
        />
      </div>
    </>);
});

export const EnterPurposeView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (<>
      Enter a purpose for the {state.typeNameLc} (changing the purpose changes the {state.typeNameLc}).
      <div>
        <WizardFieldLabel>Purpose:</WizardFieldLabel>
        <PurposeFieldView {...{state}} />
        <TextCompletionButton
          disabled={(state.purpose?.length ?? 0) === 0}
          onClick={state.setPurposeOrAssociatedDomainsEnteredFn(true)}
        />
      </div>
    </>);
});



export const RecipeWizardContentView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    switch (state.wizardStep) {
      case WizardStep.PickRecipe:
        return (
          <div style={{fontSize: "1.25rem", }}>
            <div style={{fontWeight: "bold"}}>Choose a <i>recipe</i> to create a password, key, or other secret from your DiceKey.</div>
            <div style={{marginTop: "0.5rem"}}>
              {/* <label>Recipe:</label> */}
              <SelectRecipeToLoadView state={state} defaultOptionLabel={"recipe choices"} />
            </div>
            {/* <h3>Apply a <i>recipe</i> to your DiceKey to create a password, key, or other secret.</h3>
            <LoadSavedRecipeView {...{state}} />
            <LoadBuiltInRecipeView {...{state}} />
            <CreateANewRecipeOfTypeView {...{state}} /> */}
          </div>
      );
      case WizardStep.PickAddressVsPurpose: 
        return (<DomainOrPurposeQuestionView {...{state}} />);
      case WizardStep.EnterAddressOrPurpose:
        if (state.usePurposeOrAllow == "allow") {
          return (<EnterAssociatedDomainsView {...{state}} />)
        } else {
          return (<EnterPurposeView  {...{state}} />)
        }
      case WizardStep.EditAllFields:
      case WizardStep.EditRawJson:
      case WizardStep.DoneEditing:
      default:
          return null;
    }
});

export const RecipeWizardView = observer ( ({state}: {
  state: RecipeBuilderState}) => (state.wizardComplete) ? null : (
    <div className={css.RecipeWizardContainer} style={{}}>
      <RecipeWizardContentView {...{state}} />
    </div>
));

const RecipeEditStateButton = observer( ({selected, children, ...buttonArgs}: {
  selected?: boolean,
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => 
  <button {...buttonArgs}
    className={selected ? css.RecipeEditorButtonActive : css.RecipeEditorButton}
  >{children}</button>
);

type EditButtons = "Increment" | "Decrement" | "EditFields" | "EditRawJson" | "RemoveRecipe";

export const EditButtonHoverTextView = observer(
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

export const RecipeView = observer( ({recipeBuilderState, editButtonsHoverState}: {
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
      minHeight: `calc(${diceKeyBoxSize} - 0.7rem)`,
      borderRadius: "0.35rem",
      color: "rgba(0, 0, 0, 1)",
    }}>
      { !recipeBuilderState.wizardComplete ? (
        <div style={{
          fontSize: "2rem",
          fontFamily: "sans-serif",
          marginLeft: "1rem",
          color: "rgba(0,0,0,0.5)",
        }}>recipe</div>
      ) : (
        <>
          <MultilineRecipeJsonView recipeJson={ recipeBuilderState.recipeJson  }/>
          { recipeBuilderState.recipeJson == null ? null : (
            <div style={{minHeight: "0.5vw", width: "calc(60vw - 0.7rem)", borderBottom: "1px solid rgba(0,0,0,0.1)"}}></div>
          )}
          <div>
            <RecipeDescriptionContentView state={recipeBuilderState} />
          </div>  
        </>
      ) }
    </div>
  </div>
))

export const RecipeWizardOrFieldsView = observer( ({recipeBuilderState}: {
  recipeBuilderState: RecipeBuilderState,
}) => (
  <div style={{minHeight:"24vw", marginTop: "1rem",
    display: "flex", flexDirection:"column", justifyContent:"center", alignItems:"center", alignContent: "center",
  }}
  >{ recipeBuilderState.wizardStep <= WizardStep.EnterAddressOrPurpose ? (
      <RecipeWizardView state={recipeBuilderState} />
    ) : (
      <RecipeBuilderView state={recipeBuilderState} />
    )}
  </div>
));

const screenWidthPercentUsed = 90;
const diceKeyMaxWidthPercent = 22.5;
const diceKeyBoxMaxHeight = "30vh";
const diceKeyBoxMaxWidth = `${diceKeyMaxWidthPercent}vw`;
const plusSignWidthPercent = 5;
const plusSignViewWidth = `${plusSignWidthPercent}vw`;
const recipeViewWidthPercent = screenWidthPercentUsed - (diceKeyMaxWidthPercent + plusSignWidthPercent);
const recipeViewWidth = `${recipeViewWidthPercent}vw`;
const diceKeyBoxSize = `min(${diceKeyBoxMaxHeight},${diceKeyBoxMaxWidth})`
export const DerivationViewWithState = observer( ( {
  diceKey, recipeBuilderState, derivedFromRecipeState, editButtonsHoverState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState,
  derivedFromRecipeState: DerivedFromRecipeState,
  editButtonsHoverState: HoverState<EditButtons>
}) => (
  <div style={{marginLeft: "5vw", marginRight: "5vw"}}>
    <Spacer/>
    <RecipeWizardOrFieldsView {...{recipeBuilderState}} />
    <Spacer/>
    <div className={css.DerivationView}>
      {/* Width: 90% (max): [22.5vw (max) for key] + [5vw for + sign] + [62.5vw] for recipe */}
      <div style={{alignSelf: "flex-end", fontSize:"0.9rem"}}><EditButtonHoverTextView {...{editButtonsHoverState, recipeBuilderState}}/></div>
      <div style={{display: "flex", flexDirection: "column", alignItems: "flex-start"}}>
        <div style={{display: "flex", flexDirection: "row", alignItems: "center"}}>
          {/* Key */}
          <span style={{width: diceKeyBoxSize, height: diceKeyBoxSize}}>
            <DiceKeyViewAutoSized faces={diceKey.faces} maxHeight={diceKeyBoxMaxHeight} maxWidth={diceKeyBoxMaxWidth}
              obscureAllButCenterDie={ToggleState.ObscureDiceKey}
            />
          </span>
          {/* Plus sign */}
          <span style={{width: plusSignViewWidth, textAlign: "center", fontSize:"3vw"}}>+</span>
          <RecipeView {...{recipeBuilderState, editButtonsHoverState}} />
          </div>
        <div style={{display: "flex", flexDirection: "row", alignItems: "flex-start"}}>
          <div style={{display: "flex", fontFamily: "sans-serif", fontSize: "1rem", flexDirection: "row", width: diceKeyBoxSize, justifyContent: "center", alignItems: "baseline", color: "rgba(0, 0, 0, 0.5)"}}>
            Key
          </div>
          <div style={{width: plusSignViewWidth, textAlign: "center", fontSize: "3vw", paddingTop: "0.2vh"}}>{
            true || recipeBuilderState.wizardStep > WizardStep.EnterAddressOrPurpose ? 
              // Down arrow
              (<>&#8659;</>) :
              null
          }
          </div>
          <div style={{width: recipeViewWidth, fontFamily: "sans-serif", fontSize: "1rem", textAlign: "center", color: "rgba(0, 0, 0, 0.5)",
            ...visibility(recipeBuilderState.wizardComplete)
          }}>
            Recipe
            {/* to (re)create a <SelectRecipeToLoadView state={recipeBuilderState} /> */}
          </div>
        </div>
      </div>
      <DerivedFromRecipeView {...{recipeBuilderState, state: derivedFromRecipeState}} />
      <Spacer/>
    </div>
  </div>
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
