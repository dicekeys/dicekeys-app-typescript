import css from "../Recipes.module.css";
import * as Dimensions from "./Dimensions";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, WizardStep } from "../RecipeBuilderState";
import { SelectRecipeToLoadView } from "../LoadRecipeView";

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
      Paste the address of the website (e.g., https://example.com) or enter its domain name.
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
          <div>
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

const WizardBorderWidth = "3px";
export const RecipeWizardView = observer ( ({state}: {
  state: RecipeBuilderState}) => (state.wizardComplete) ? null : (
    <div className={css.RecipeWizardContainer} style={{
      width: `calc(${Dimensions.ScreenWidthPercentUsed}vw - (2 * (${Dimensions.BoxPadding} + ${WizardBorderWidth})))`,
      padding: `${Dimensions.BoxPadding}`,
      // borderStyle: "outset",
      // borderWidth: WizardBorderWidth,
      // borderColor: "black",
    }}>
      <RecipeWizardContentView {...{state}} />
    </div>
));
