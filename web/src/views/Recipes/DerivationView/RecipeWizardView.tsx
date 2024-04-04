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
const WizardStepContainerBorderRadius = '0.5rem';
const WizardStepContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: space-between;
  background-color: rgb(249, 249, 218);
  font-size: min(1.3rem, 3.5vh);
  align-content: center;
  border-radius: ${WizardStepContainerBorderRadius};
  width: ${WizardStepContainerWidth};
  padding-left: ${WizardPaddingH};
  padding-right: ${WizardPaddingH};
  padding-top: ${WizardPaddingV};
  padding-bottom: ${WizardPaddingV};
  min-height: ${Dimensions.WizardMinHeightInVh}vh;
`;

const WizardStepInstruction = styled.div``;

const WizardBackAnchor = styled.a`
  position: absolute;
  text-decoration: none;
  top: 0;
  z-index: 1;
  right: ${WizardStepContainerBorderRadius};
  width: auto;
`;

export const WizardBack = ({onBack}: {onBack: () => void}) => (
    <WizardBackAnchor onClick={e => {e.preventDefault(); onBack() }}>&larr;
    </WizardBackAnchor>
);

// export const WizardStepInstructionNote = styled.div`
//   font-size: 1rem;
// `;

export const WizardFieldRow = styled.div`
  align-self: center;
`;

export const WizardStepAlternatives = styled.div`
  align-self: flex-end;
  justify-self: flex-end;
  margin-top: 0.5rem;
`;

export const TextCompletionButtonStyled = styled.button.attrs(() =>({
  tabIndex: -1 as number // Widening type from -1 to number is hack to fix typing issues in StyledComponents/InferComponentProps
}))`
  background-color: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  margin-left: 0.25rem;
  font-size: calc(min(2.8rem, 2.8vh));
  user-select: none;
  &:hover {
    /* outline:0; */
    background-color: rgba(0,0,0,0.2);
  }
  &:active {
    /* background: gray; */
    background-color: rgba(0,0,0,0.4);
  }
`;

export const TextCompletionButton = ( {...attributes}: React.ButtonHTMLAttributes<HTMLButtonElement> = {}) => (
  <TextCompletionButtonStyled {...attributes}>&#9166;</TextCompletionButtonStyled>
);


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
  font-size: min(0.9rem, 2.7vh);
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
