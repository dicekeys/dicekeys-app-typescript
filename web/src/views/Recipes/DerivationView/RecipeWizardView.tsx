import css from "../Recipes.module.css";
import * as Dimensions from "./Dimensions";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, WizardStep } from "../RecipeBuilderState";
import { SelectRecipeToLoadView } from "../LoadRecipeView";
import { EnhancedRecipeView } from "../EnhancedRecipeView";
import { describeRecipeType } from "../DescribeRecipeType";
import {EventHandlerOverridesDefault} from "../../../utilities/EventHandlerOverridesDefault";

const WizardBorderWidth = "3px";
export const WizardPaddingH = `1.5rem`
export const WizardPaddingV = `0.5rem`
export const WizardStepContainer = ({children}: React.PropsWithChildren<{}>) => (
  <div className={css.RecipeWizardContainer} style={{
    width: `calc(${Dimensions.ScreenWidthPercentUsed}vw - (2 * (${WizardPaddingH} + ${WizardBorderWidth})))`,
    paddingLeft: WizardPaddingH, paddingRight: WizardPaddingH,
    paddingTop: WizardPaddingV, paddingBottom: WizardPaddingV,
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "space-between",
    minHeight: `${Dimensions.WizardMinHeightInVh}vh`,
    // borderStyle: "outset",
    // borderWidth: WizardBorderWidth,
    // borderColor: "black",
  }}>
    {children}
  </div>
);

export const WizardStepInstruction = ({children, style, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} style={{...style}} >
    {children}
  </div>
);

export const WizardStepInstructionNote = ({children, style, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} style={{fontSize: `1rem`, ...style}} >
    {children}
  </div>
);

export const WizardFieldRow = ({children, style, ...props}: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...props} style={{
    alignSelf: "center",
    // marginTop: `1rem`,
    ...style
  }} >
    {children}
  </div>
);

export const WizardStepAlternatives = ({children}: React.PropsWithChildren<{}>) => (
  <div style={{
    alignSelf: "flex-end",
    justifySelf: "flex-end",
    marginTop: "0.5rem",
  }
  }>
    {children}
  </div>
);

export const SiteTextFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  return (
    <input type="text"
      style={{marginLeft: `1rem`}}
      className={css.PurposeOrHostNameTextField}
      id={"Site"}
      spellCheck={false}
      size={60}
      value={state.siteTextField ?? ""}
      placeholder="example.com"
      // Focus input when it's created
      ref={ e => e?.focus() }
      // Update our state store when the field changes
      onInput={ e => {state.setSiteTextField(e.currentTarget.value); }}
      // Special handling for pastes
      onPaste={ state.pasteIntoSiteTextField }
        // Handle enter key
      onKeyUp={ e => {if (e.key === "Enter" && (state.hosts?.length ?? 0) > 0) {
        state.setWizardPrimaryFieldEntered(true);
      }}}
    />
  );
});

const rawJsonFieldWidth = '60vw'; // FIXME

export const RawJsonFieldView = observer( ({state, focusOnCreate}: {
  state: RecipeBuilderState,
  focusOnCreate?: boolean
}) => {
//  const textAreaComponentRef = React.useRef<HTMLTextAreaElement>(null);
  return (
  <div style={{display: "inline-block"}}>
    <div className={css.FormattedRecipeUnderlay} style={{
      width: rawJsonFieldWidth,
    }} >
      <EnhancedRecipeView recipeJson={state.recipeJson} />
    </div>
    <textarea
      spellCheck={false}
//      ref={textAreaComponentRef}
      ref={ta => {if(focusOnCreate) {ta?.focus() }}}
      className={css.FormattedRecipeTextField}
      value={state.recipeJson ?? ""}
      rows={2}
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
      // Focus input when it's created
      ref={ e => e?.focus() }
      onInput={ e => {state.setPurposeField(e.currentTarget.value); }}
      onKeyUp={ e => {if (e.key === "Enter" && e.currentTarget.value.length > 0) { 
        state.setWizardPrimaryFieldEntered(true);
      }}}
    />
  );
});

export const TextCompletionButton = ( {...attributes}: React.ButtonHTMLAttributes<HTMLButtonElement> = {}) => (
  <button {...attributes}>&#9166;</button>
);

export const PurposeOrSiteEnteredButton = ({state}: {
  state: RecipeBuilderState}) => (
  <TextCompletionButton onClick={state.setWizardPrimaryFieldEnteredFn(true)} />
);

export const WizardFieldLabel = observer ( ({...attributes}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    style={{minWidth: "10rem", marginRight: "1rem", textAlign: "right"}}
  >{attributes.children}</label>
) );

export const WizardStepEnterSiteView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardStepInstruction>
          Paste the address of the website (e.g., https://example.com) that this {describeRecipeType(state.type)} will be used for, or enter its domain name.
        </WizardStepInstruction>
        <WizardFieldRow>
          {/* <WizardFieldLabel>Address/Domain</WizardFieldLabel> */}
          <SiteTextFieldView { ...{state}} />
          <TextCompletionButton
            disabled={(state.hosts?.length ?? 0) === 0}
            onClick={state.setWizardPrimaryFieldEnteredFn(true)}
          />
        </WizardFieldRow>
        <WizardStepAlternatives>
          <a href="" style={{fontSize: `0.9rem`}}
            onClick={EventHandlerOverridesDefault( () => state.setWizardPrimaryFieldOverride("purpose") )}
          >enter a purpose instead</a>
          <a href="" style={{fontSize: `0.9rem`, marginLeft: `1rem`}}
            onClick={EventHandlerOverridesDefault( () => state.setWizardPrimaryFieldOverride("rawJson") )}
          >enter raw json instead</a>
        </WizardStepAlternatives>
      </WizardStepContainer>);
});

export const WizardStepEnterPurposeView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardStepInstruction>
          Enter a purpose for the {state.typeNameLc}.
        </WizardStepInstruction>
        {/* <WizardStepInstructionNote>Changing even one letter or space of the purpose changes the {state.typeNameLc}.</WizardStepInstructionNote> */}
        <WizardFieldRow>
          {/* <WizardFieldLabel>Purpose:</WizardFieldLabel> */}
          <PurposeFieldView {...{state}} />
          <TextCompletionButton
            disabled={(state.purpose?.length ?? 0) === 0}
            onClick={state.setWizardPrimaryFieldEnteredFn(true)}
          />
        </WizardFieldRow>
        <WizardStepAlternatives>
          <a href="" style={{fontSize: `0.9rem`}} onClick={EventHandlerOverridesDefault(() => 
            state.setWizardPrimaryFieldOverride(undefined)
          )}>enter a web address instead</a>
          <a href=""
            style={{fontSize: `0.9rem`, marginLeft: `1rem`}}
            onClick={EventHandlerOverridesDefault( ()  => state.setWizardPrimaryFieldOverride("rawJson")) }
          >enter raw json instead</a>
        </WizardStepAlternatives>
      </WizardStepContainer>
    );
});



const WizardStepEnterRawJsonStepView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardStepInstruction>
        Paste or type the raw JSON recipe for the {state.typeNameLc}.
        </WizardStepInstruction>
        <WizardFieldRow>
          <RawJsonFieldView {...{state, focusOnCreate: true}} />
          <TextCompletionButton
            disabled={state.recipe == null}
            onClick={state.setWizardPrimaryFieldEnteredFn(true)}
          />
        </WizardFieldRow>
        <WizardStepAlternatives>
          <a href="" style={{fontSize: `0.9rem`}} onClick={EventHandlerOverridesDefault(() => 
            state.setWizardPrimaryFieldOverride(undefined)
          )}>enter a web address instead</a>
          <a href="" style={{fontSize: `0.9rem`, marginLeft: `1rem`}}
            onClick={EventHandlerOverridesDefault( () => state.setWizardPrimaryFieldOverride("purpose") )}
          >enter a purpose instead</a>
        </WizardStepAlternatives>
      </WizardStepContainer>
    );
});

export const RecipeWizardStepPickRecipeView = observer ( ({state}: {
  state: RecipeBuilderState
}) => (
  <WizardStepContainer>
    <div/>
    <div>
      <WizardStepInstruction style={{fontWeight: "bold"}}>
        Choose a <i>recipe</i> to create a password, key, or other secret from your DiceKey.
        </WizardStepInstruction>
      <WizardFieldRow>
        <SelectRecipeToLoadView state={state} defaultOptionLabel={"recipe choices"} />
      </WizardFieldRow>
    </div>
    <div/>
  </WizardStepContainer>
));

export const RecipeWizardContentView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    switch (state.wizardStep) {
      case WizardStep.PickRecipe:
        return (<RecipeWizardStepPickRecipeView {...{state}} />)
      case WizardStep.EnterSite:
        return (<WizardStepEnterSiteView {...{state}} />)
      case WizardStep.EnterPurpose:
            return (<WizardStepEnterPurposeView  {...{state}} />)
      case WizardStep.EnterRawJson:
        return (<WizardStepEnterRawJsonStepView {...{state}} />); // FIXME
      case WizardStep.Complete: return null; // should never occur
    }
});

export const RecipeWizardView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
  switch (state.wizardStep) {
    case WizardStep.PickRecipe:
      return (<RecipeWizardStepPickRecipeView {...{state}} />)
    case WizardStep.EnterSite:
      return (<WizardStepEnterSiteView {...{state}} />)
    case WizardStep.EnterPurpose:
          return (<WizardStepEnterPurposeView  {...{state}} />)
    case WizardStep.EnterRawJson:
      return (<WizardStepEnterRawJsonStepView {...{state}} />); // FIXME
    case WizardStep.Complete: return null;
  }
});
