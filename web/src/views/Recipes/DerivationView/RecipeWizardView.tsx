import * as Dimensions from "./DerivationViewLayout";
import React from "react";
import { observer  } from "mobx-react";
import { RecipeBuilderState, WizardStep } from "../RecipeBuilderState";
import { SelectRecipeToLoadView } from "../LoadRecipeView";
import { EnhancedRecipeView } from "../EnhancedRecipeView";
import { describeRecipeType } from "../DescribeRecipeType";
import {EventHandlerOverridesDefault} from "../../../utilities/EventHandlerOverridesDefault";
import styled from "styled-components";
import {
  FormattedJsonContainer,
  FormattedRecipeTextAreaJson,
  FormattedRecipeUnderlayJson,
  HostNameInputField,
  PurposeInputField
} from "./RecipeStyles";
import { cssCalcTyped, cssExprWithoutCalc } from "../../../utilities";

const WizardBorderWidth = "3px";
const WizardPaddingH = `1.5rem`;
const WizardPaddingV = `0.5rem`;

const WizardStepContainerWidth = cssCalcTyped(
  `${cssExprWithoutCalc(Dimensions.ContentWidth)} - (2 * (${WizardPaddingH} + ${WizardBorderWidth})))`
);
const WizardStepContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  background-color: rgb(249, 249, 218);
  font-size: 1.3rem;
  align-content: center;
  border-radius: 0.5rem;
  width: ${WizardStepContainerWidth};
  padding-left: ${WizardPaddingH};
  padding-right: ${WizardPaddingH};
  padding-top: ${WizardPaddingV};
  padding-bottom: ${WizardPaddingV};
  min-height: ${Dimensions.WizardMinHeightInVh}vh;
`;

const WizardStepInstruction = styled.div``;

const WizardBackDiv = styled.div`
  position: relative;
  align-self: flex-end;
  justify-self: flex-start;
`;

const WizardBackAnchor = styled.a`
  position: "absolute";
  text-decoration: "none";
  z-index: 1;
  right: 0;
`;

export const WizardBack = ({onBack}: {onBack: () => void}) => (
  <WizardBackDiv>
    <WizardBackAnchor onClick={e => {e.preventDefault(); onBack() }}>&larr;
    </WizardBackAnchor>
  </WizardBackDiv>
);

export const WizardStepInstructionNote = styled.div`
  font-size: 1rem;
`;

export const WizardFieldRow = styled.div`
  align-self: center;
`;

export const WizardStepAlternatives = styled.div`
  align-self: flex-end;
  justify-self: flex-end;
  margin-top: 0.5rem;
`;

export const SiteTextFieldView = observer( ({state}: {
  state: RecipeBuilderState,
} ) => {
  return (
    <HostNameInputField
      id={"Site"}
      size={60}
      value={state.siteTextField ?? ""}
      placeholder="https://example.com"
      // Focus input when it's created
      ref={ e => e?.focus() }
      // Update our state store when the field changes
      onInput={ e => {state.setSiteTextField(e.currentTarget.value); }}
      // Special handling for pastes
      onPaste={ state.pasteIntoSiteTextField }
        // Handle enter key
      onKeyUp={ e => {if (e.key === "Enter" && state.hosts.length > 0) {
        state.setWizardPrimaryFieldEntered(true);
      }}}
    />
  );
});


export const RawJsonFieldView = observer( ({state, focusOnCreate}: {
  state: RecipeBuilderState,
  focusOnCreate?: boolean
}) => {
  return (
  <FormattedJsonContainer>
    <FormattedRecipeTextAreaJson
      ref={ta => {if(focusOnCreate) {ta?.focus() }}}
      value={state.rawRecipeJson ?? ""}
      onInput={ e => {state.setAllFromRecipeJson(e.currentTarget.value);  }} 
    >
      <FormattedRecipeUnderlayJson>
        <EnhancedRecipeView recipeJson={state.rawRecipeJson} />
      </FormattedRecipeUnderlayJson>
    </FormattedRecipeTextAreaJson>
  </FormattedJsonContainer>
)});

export const PurposeFieldView = observer( ({state, focusOnCreate}: {
  state: RecipeBuilderState,
  focusOnCreate?: boolean
}) => (
    <PurposeInputField
      id={"purpose"}
      size={40}
      value={state.purposeField ?? ""}
      placeholder=""
      // Focus input when it's created
      ref={ focusOnCreate ? (e => e?.focus()) : undefined }
      onInput={ e => {state.setPurposeField(e.currentTarget.value); }}
      onKeyUp={ e => {if (e.key === "Enter" && e.currentTarget.value.length > 0) { 
        state.setWizardPrimaryFieldEntered(true);
      }}}
    />
  )
);

export const TextCompletionButton = ( {...attributes}: React.ButtonHTMLAttributes<HTMLButtonElement> = {}) => (
  <button {...attributes}>&#9166;</button>
);

export const PurposeOrSiteEnteredButton = ({state}: {
  state: RecipeBuilderState}) => (
  <TextCompletionButton onClick={state.setWizardPrimaryFieldEnteredFn(true)} />
);

export const WizardFieldLabel = styled.label`
  min-width: 10rem;
  margin-right: 1rem;
  text-align: right;
`;

const WizardStepAlternativeAnchor = styled.a.attrs(() => ({
  href: ""
}))`
  font-size: 0.9rem;
  &:not(:first-of-type) {
    margin-left: 1rem;
  }
`;

export const WizardStepEnterSiteView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardBack onBack={state.emptyAllRecipeFields} />
        <WizardStepInstruction>
          Paste or enter the address of the website that will use this {describeRecipeType(state.type)}.
        </WizardStepInstruction>
        <WizardFieldRow>
          {/* <WizardFieldLabel>Address/Domain</WizardFieldLabel> */}
          <SiteTextFieldView { ...{state}} />
          <TextCompletionButton
            disabled={state.hosts.length === 0}
            onClick={state.setWizardPrimaryFieldEnteredFn(true)}
          />
        </WizardFieldRow>
        <WizardStepAlternatives>
          <WizardStepAlternativeAnchor
            onClick={EventHandlerOverridesDefault( () => state.setWizardPrimaryFieldOverride("purpose") )}
          >enter a purpose instead</WizardStepAlternativeAnchor>
          <WizardStepAlternativeAnchor
            onClick={EventHandlerOverridesDefault( () => state.setWizardPrimaryFieldOverride("rawJson") )}
          >enter raw json instead</WizardStepAlternativeAnchor>
        </WizardStepAlternatives>
      </WizardStepContainer>
    );
});


export const WizardStepSaveView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardBack onBack={state.cancelSave} />
        <WizardStepInstruction>
          Enter name to associate with this recipe.
        </WizardStepInstruction>
        <WizardFieldRow>
          <input type="text"
            id={"nameToSave"}
            spellCheck={false}
            size={30}
            value={state.nameField ?? ""}
            // Focus input when it's created
            ref={ e => e?.focus() }
            onInput={ e => {state.setNameField(e.currentTarget.value); }}
            onKeyUp={ e => {if (e.key === "Enter" && e.currentTarget.value.length > 0) { 
              state.completeSave()
            }}}
          />
          <button
            disabled={(state.nameField?.length ?? 0) === 0}
            onClick={state.completeSave}          
          >save</button>
        </WizardFieldRow>
      </WizardStepContainer>);
});

export const WizardStepEnterPurposeView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardBack onBack={state.emptyAllRecipeFields} />
        <WizardStepInstruction>
          Enter a purpose for the {state.typeNameLc}.
        </WizardStepInstruction>
        {/* <WizardStepInstructionNote>Changing even one letter or space of the purpose changes the {state.typeNameLc}.</WizardStepInstructionNote> */}
        <WizardFieldRow>
          {/* <WizardFieldLabel>Purpose:</WizardFieldLabel> */}
          <PurposeFieldView {...{state}} focusOnCreate={true} />
          <TextCompletionButton
            disabled={(state.purpose?.length ?? 0) === 0}
            onClick={state.setWizardPrimaryFieldEnteredFn(true)}
          />
        </WizardFieldRow>
        <WizardStepAlternatives>
          <WizardStepAlternativeAnchor onClick={EventHandlerOverridesDefault(() => 
            state.setWizardPrimaryFieldOverride(undefined)
          )}>enter a web address instead</WizardStepAlternativeAnchor>
          <WizardStepAlternativeAnchor
            onClick={EventHandlerOverridesDefault( ()  => state.setWizardPrimaryFieldOverride("rawJson")) }
          >enter raw json instead</WizardStepAlternativeAnchor>
        </WizardStepAlternatives>
      </WizardStepContainer>
    );
});



const WizardStepEnterRawJsonStepView = observer ( ({state}: {
  state: RecipeBuilderState}) => {
    return (
      <WizardStepContainer>
        <WizardBack onBack={state.emptyAllRecipeFields} />
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
          <WizardStepAlternativeAnchor onClick={EventHandlerOverridesDefault(() => 
            state.setWizardPrimaryFieldOverride(undefined)
          )}>enter a web address instead</WizardStepAlternativeAnchor>
          <WizardStepAlternativeAnchor
            onClick={EventHandlerOverridesDefault( () => state.setWizardPrimaryFieldOverride("purpose") )}
          >enter a purpose instead</WizardStepAlternativeAnchor>
        </WizardStepAlternatives>
      </WizardStepContainer>
    );
});

const WizardStepPrimaryInstruction = styled(WizardStepInstruction)`
  font-weight: bold;
`;

export const RecipeWizardStepPickRecipeView = observer ( ({state}: {
  state: RecipeBuilderState
}) => (
  <WizardStepContainer>
    <WizardStepPrimaryInstruction>
      Choose a <i>recipe</i> to create a password, key, or other secret from your DiceKey.
      </WizardStepPrimaryInstruction>
    <WizardFieldRow>
      <SelectRecipeToLoadView state={state} defaultOptionLabel={"recipe choices"} />
    </WizardFieldRow>
  </WizardStepContainer>
));


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
      return (<WizardStepEnterRawJsonStepView {...{state}} />);
    case WizardStep.Save:
      return (<WizardStepSaveView {...{state}} />);
    case WizardStep.Complete: return null;
  }
});
