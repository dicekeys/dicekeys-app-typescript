import React from "react";
import { observer  } from "mobx-react";
import { CharButton, CharButtonToolTip, OptionallyObscuredTextView, SecretFieldsCommonObscureButton } from "../basics";
import { ToggleState } from "../../state";
import { action } from "mobx";
import { DerivedFromRecipeState, OutputFormats, OutputFormat } from "./DerivedFromRecipeState";
import { DerivationRecipeType } from "../../dicekeys/StoredRecipe";
import { describeRecipeType } from "./DescribeRecipeType";
import * as Dimensions from "./DerivationView/Dimensions";
import styled from "styled-components";

const Bip39Field = styled.div`
  display: flex;
  flex-direction: row;
  flex-flow: wrap;
  justify-content: flex-start;
  align-content: flex-start;
  user-select: all;
`;

const Bip39WordSpan = styled.span`
  display: flex;
  flex-flow: nowrap;
  flex-direction: row;
  align-items: baseline;
`;

const Bip39WordAndIndex = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  flex-shrink: 0;
`;

const Bip39WordAboveIndex = styled.div`
  border-bottom: 1px gray solid;
  align-items: baseline;
`;
const Bip39IndexBelowWord = styled.div`
  font-size: 0.5rem;
  flex-direction: row;
  color: gray;
  align-items: baseline;
  user-select: none;
`;

const Bip39OutputView = ({bip39String, obscureValue}: {bip39String: string, obscureValue: boolean}) => {
  let bip39WordArray = bip39String.split(" ");
  if (obscureValue) {
    bip39WordArray = bip39WordArray.map( plaintextWord => "************".substr(0, plaintextWord.length) ).sort();
  }
  return (
    <Bip39Field>{
      bip39WordArray.map( (word, index) => (
        <Bip39WordSpan key={index}>
          { // put spaces between words by inserting space before every word but first
            index !== 0 ? (<>&nbsp;</>) : null}
          <Bip39WordAndIndex key={index}>
            <Bip39WordAboveIndex>{word}</Bip39WordAboveIndex>
            <Bip39IndexBelowWord>{`${index+1}`}</Bip39IndexBelowWord>
          </Bip39WordAndIndex>
        </Bip39WordSpan>
      ))
    }</Bip39Field>
  )
}

const SelectOutputType = styled.select`
  padding: 0.25rem;
  min-width: 6rem;
  margin-left: calc(${Dimensions.DiceKeyBoxSize} - 1.5rem);
 `

const SelectDerivedOutputType = observer( ({type, state}: {type?: DerivationRecipeType, state: DerivedFromRecipeState}) => (
  <SelectOutputType
    disabled={type==null}
    value={ (type == null) ? "NullType" : state.outputFieldForType[type]}
    onChange={ (e) => state.setOutputField(e.currentTarget.value as OutputFormat) }
  >
    { type == null ? (
        <option value="NullType" disabled={true}>format</option>
      ) : 
        OutputFormats[type].map( (format: string) => (
          <option key={format} value={format}>{format}</option>
        ))  
    }
  </SelectOutputType>
));

const DerivedValueHeaderDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-self: flex-start;
  width: 90vw;
`

export const DerivedFromRecipeView = observer( ({state, showPlaceholder}: {
    state: DerivedFromRecipeState
    showPlaceholder: boolean
  }) => {
  const {recipeState: recipe, derivedValue} = state;
  const {type} = recipe;
  const copyToClipboard = action ( () => {
    if (derivedValue != null) {
      navigator.clipboard.writeText(derivedValue);
    }
    // FUTURE - provide user notification that copy happened.
  });
  return (
    <>
      <DerivedValueHeaderDiv>
        <SelectDerivedOutputType type={type} state={state} />
        <span style={{width: "1rem"}}></span>
        <span style={{width: "1rem"}}></span>
        { type == null ? null : (
          <>
          <CharButton
              invisible={derivedValue == null || type == null}
              onClick={copyToClipboard}
            >&#128203;<CharButtonToolTip>Copy {type == null ? "" : state.outputFieldForType[type].toLocaleLowerCase()} to clipboard</CharButtonToolTip>
          </CharButton>
          <SecretFieldsCommonObscureButton />
          </>
        )}
      </DerivedValueHeaderDiv>
      { type === "Secret" && state.outputFieldForType[type] === "BIP39" && derivedValue != null ?
        (<Bip39OutputView bip39String={derivedValue} obscureValue={ ToggleState.ObscureSecretFields.value } />)
        : (
        <DerivedValueHeaderDiv>
          { showPlaceholder ? (
            <><i style={{color: "rgba(0,0,0,0.5"}}>A {describeRecipeType(recipe.type)} to be created by applying a recipe to your DiceKey</i></>
          ) : (
            <OptionallyObscuredTextView value={derivedValue} obscureValue={ ToggleState.ObscureSecretFields.value } />
          )}
        </DerivedValueHeaderDiv>
      )}
    </>
  );
  }
);
