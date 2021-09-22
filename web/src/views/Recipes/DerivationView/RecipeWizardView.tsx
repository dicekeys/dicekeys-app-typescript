import css from "../Recipes.module.css";
import * as Dimensions from "./Dimensions";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, WizardStep } from "../RecipeBuilderState";
import { SelectRecipeToLoadView } from "../LoadRecipeView";
import { EnhancedRecipeView } from "../EnhancedRecipeView";

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
        selected={state.wizardSecondInput === "allow"}
        onClick={state.setWizardSecondInputFn("allow")}
      >yes</InlineButton>
      <InlineButton
        selected={state.wizardSecondInput === "purpose"}
        onClick={state.setWizardSecondInputFn("purpose")}
      >no</InlineButton>
      <a href="#"
        onClick={e => {
          e.preventDefault();
          state.setWizardSecondInput("rawJson");
        }}
      >raw</a>
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

const rawJsonFieldWidth = '60vw'; // FIXME

export const RawJsonFieldView = observer( ({state}: {
  state: RecipeBuilderState
}) => {
  
  const textAreaComponentRef = React.useRef<HTMLTextAreaElement>(null);
  return (
  <div className={css.FormattedRecipeBox}>
  <div className={css.FormattedRecipeUnderlay} style={{
    width: rawJsonFieldWidth,
  }} >
    <EnhancedRecipeView recipeJson={state.recipeJson} />
  </div>
  <textarea
    spellCheck={false}
    ref={textAreaComponentRef}
    className={css.FormattedRecipeTextField}
    value={state.recipeJson ?? ""}
    onInput={ e => {state.setRecipeJson(e.currentTarget.value);  }} 
    style={{
      width: rawJsonFieldWidth,
    }}
  />
</div>
)});

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
  <TextCompletionButton onClick={state.setWizardThirdInputEnteredFn(true)} />
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
          onClick={state.setWizardThirdInputEnteredFn(true)}
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
          onClick={state.setWizardThirdInputEnteredFn(true)}
        />
      </div>
    </>);
});

const EnterRawJsonStepView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (<>
      If you're sure you know what you're doing, enter the raw JSON recipe for the {state.typeNameLc}.
      <div>
        <RawJsonFieldView {...{state}} />
        <TextCompletionButton
          disabled={state.recipe == null}
          onClick={state.setWizardThirdInputEnteredFn(true)}
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
      case WizardStep.EnterSite:
        return (<EnterAssociatedDomainsView {...{state}} />)
      case WizardStep.EnterPurpose:
            return (<EnterPurposeView  {...{state}} />)
      case WizardStep.EnterRawJson:
        return (<EnterRawJsonStepView {...{state}} />); // FIXME
      case WizardStep.Complete: return null; // should never occur
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
