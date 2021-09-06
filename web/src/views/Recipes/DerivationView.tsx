import css from "./Recipes.module.css";
import React from "react";
import { observer  } from "mobx-react";
//import { RecipeBuilderView } from ".";
import { RecipeBuilderState, RecipeEditingMode, WizardStep } from "./RecipeBuilderState";
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
import { RecipeBuilderView } from "./RecipeBuilderView";

interface DerivationViewProps {
  diceKey: DiceKey;
}

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
    return (<div>
      Protect this {state.typeNameLc} by limiting which website or application can request it?
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
    style={{minWidth: "10rem", textAlign: "right"}}
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
      <PurposeFieldView {...{state}} />
      <TextCompletionButton
        disabled={(state.purpose?.length ?? 0) === 0}
        onClick={state.setPurposeOrAssociatedDomainsEnteredFn(true)}
      />
    </>);
});


export const RecipeWizardView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    switch (state.wizardStep) {
      case WizardStep.PickRecipe:
        return null;
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
    // if (state.type == null) return null;
    // if (state.purposeIsToAssociateWithDomains == null) {
    //   return (<DomainOrPurposeQuestionView {...{state}} />);
    // }
    // return (<>
    //   Enter a purpose for the {state.typeNameLc} (changing the purpose changes the {state.typeNameLc}).
    // </>);
});

const RecipeEditStateButton = observer( ({selected, children, ...buttonArgs}: {
  selected?: boolean,
} & React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => 
  <button {...buttonArgs}
    className={selected ? css.RecipeEditorButtonActive : css.RecipeEditorButton}
  >{children}</button>
);

type EditButtons = "Increment" | "Decrement" | "EditFields" | "EditRawJson";

export const EditButtonHoverTextView = observer(
  ({editButtonsHoverState, recipeBuilderState}: {
    editButtonsHoverState: HoverState<EditButtons>,
    recipeBuilderState: RecipeBuilderState,
  }) => {
    switch(editButtonsHoverState.state) {
      case "Increment":
        return recipeBuilderState.sequenceNumber! > 1 ?
        (<>Increment the sequence number to change the {recipeBuilderState.typeNameLc}</>):
        (<>Add a sequence number to create a different {recipeBuilderState.typeNameLc}</>);
      case "Decrement":
        return recipeBuilderState.sequenceNumber! > 2 ?
        (<>Decrement the sequence number</>) :
        recipeBuilderState.sequenceNumber! == 2 ?
        (<>Remove the sequence number</>) : (<>&nbsp;</>);
      case "EditFields":
        return (<>Edit the fields of this recipe</>)
      case "EditRawJson":
        return (<>Edit this recipe's raw JSON.</>)
        default: return (<>&nbsp;</>);
    }
});

export const DerivationViewWithState = observer( ( {
  diceKey, recipeBuilderState, derivedFromRecipeState, editButtonsHoverState}: {
  diceKey: DiceKey,
  recipeBuilderState: RecipeBuilderState,
  derivedFromRecipeState: DerivedFromRecipeState,
  editButtonsHoverState: HoverState<EditButtons>
}) => (
  <ContentBox>
    <Spacer/>
    <div className={css.DerivationView}>
      <RecipeWizardView state={recipeBuilderState} />
      <RecipeBuilderView state={recipeBuilderState} />
      <div><EditButtonHoverTextView {...{editButtonsHoverState, recipeBuilderState}}/></div>
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
                hidden={recipeBuilderState.type == null || recipeBuilderState.sequenceNumber == null}
                {...editButtonsHoverState.hoverStateActions("Decrement")}
                onClick={recipeBuilderState.sequenceNumberState.decrement}>-</RecipeEditStateButton>
              <RecipeEditStateButton
                hidden={recipeBuilderState.type == null}
                {...editButtonsHoverState.hoverStateActions("Increment")}
                onClick={recipeBuilderState.sequenceNumberState.increment}>+</RecipeEditStateButton>
              <RecipeEditStateButton
                hidden={recipeBuilderState.type == null}
                {...editButtonsHoverState.hoverStateActions("EditFields")}
                selected={recipeBuilderState.editingMode === RecipeEditingMode.EditWithTemplateOnly}
                onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditWithTemplateOnly);}} style={{textDecoration: "underline"}}>&nbsp;&#9998;&nbsp;</RecipeEditStateButton>
              <RecipeEditStateButton
                hidden={recipeBuilderState.type == null}
                {...editButtonsHoverState.hoverStateActions("EditRawJson")}
                selected={recipeBuilderState.editingMode === RecipeEditingMode.EditIncludingRawJson}
                onClick={()=>{recipeBuilderState.toggleEditingMode(RecipeEditingMode.EditIncludingRawJson);}
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
