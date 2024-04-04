import React from "react";
import { observer  } from "mobx-react";
import { CharButton, CharButtonToolTip, OptionallyObscuredTextView, SecretFieldsCommonObscureButton } from "../basics";
import { DerivedFromRecipeState, OutputFormats, OutputFormat } from "./DerivedFromRecipeState";
import { describeRecipeType } from "./DescribeRecipeType";
import * as Dimensions from "./DerivationView/DerivationViewLayout";
import styled from "styled-components";
import { copyToClipboard } from "../../utilities/copyToClipboard";
import { RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { electronBridge } from "../../state/core/ElectronBridge";
import { defaultOnException } from "../../utilities/default-on-exception";
import { Recipe } from "@dicekeys/dicekeys-api-js";
import { QrCodeOverlayState, QrCodeOverlayView } from "./QrCodeOverlay";
import QrCodeSvg from "../../images/QrCode.svg";
import { HideRevealSecretsState } from "../../state/stores/HideRevealSecretsState";

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
  font-size: 1rem;
  padding-left: 0.25rem;
  padding-right: 0.25rem;
  min-width: 6rem;
`;

const SelectDerivedOutputType = observer( ({state}: {state: DerivedFromRecipeState}) => {
  const {type, outputFormat} = state.secretTypeAndOutputType ?? {};
  return (
    <SelectOutputType
      disabled={type==null}
      value={ outputFormat ?? "NullType"}
      onChange={ (e) => state.setOutputField(e.currentTarget.value as OutputFormat) }
    >
      { type == null ? (
          <option value="NullType" disabled={true}>format</option>
        ) : 
          OutputFormats[type].map( (format: string) =>
            // Skip BIP39 if secret length isn't 32 bytes
            (format === "BIP39" && state.derivedSeedBytesHex?.length != 64) ? null :
            (
              <option key={format} value={format}>{format}</option>
            ))  
      }
    </SelectOutputType>
    )}
);

const PlaceholderDerivedValueContainer = styled.div`
  font-family: sans-serif;
  font-style: italic;
  color: ${ props => props.theme.colors.foregroundDeemphasized };
`;

const DerivedValueHeaderFormula = `((${Dimensions.DiceKeyBoxSize}) - 1.5rem)`;
const DerivedValueHeaderDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-content: baseline;
  align-self: flex-start;
  padding-left: calc(${DerivedValueHeaderFormula});
  width: calc(${Dimensions.ContentWidth} - (${DerivedValueHeaderFormula}));
`

const DerivedValueContentDivLeftRightPadding = `0.5rem`;

const DerivedValueContentDivBorderWidth = `1px`

const DerivedValueContentDiv = styled.div`
  width: calc(${Dimensions.ContentWidth} - 2 * (${DerivedValueContentDivLeftRightPadding} + ${DerivedValueContentDivBorderWidth}));
  border-width: ${DerivedValueContentDivBorderWidth};
  border-color: rgba(128,128,128,0.5);
  border-style: solid;
  padding-left: ${DerivedValueContentDivLeftRightPadding};
  padding-right: ${DerivedValueContentDivLeftRightPadding};
  font-family: monospace;
  white-space: pre;
  overflow-y: auto;
  user-select: all;
`;

const HeaderButtonBar = styled.div`
  display: flex;
  flex-direction: row;
  margin-left: 2rem;
`;

const recipeStateToFileName = (state: DerivedFromRecipeState): string | undefined => {
  const {recipeState, diceKey, outputFieldForType} = state;
  const {type, recipeJson, recipeIsValid} = recipeState;
  if (!recipeIsValid || recipeJson == null || type == null) return;
  const recipe = defaultOnException(() => JSON.parse(recipeJson) as Recipe);
  if (recipe == null) return;
  const sequenceNumber = recipe["#"];
  const purpose = recipe.purpose;
  const outputType = outputFieldForType[type];
  const commonName = `${ diceKey == null ? "" :
    `-derived-from-die-with-${diceKey.centerLetterAndDigit}-at-center`
  }${ (sequenceNumber == null || sequenceNumber <= 1) ? "" :
    `-with-sequence-number-${sequenceNumber}`
  }${ (purpose == null) ? "" :
  `-with-purpose-${ purpose.replace(/\W/g, '') }`
  }`;
  return outputType === "OpenPGP Private Key" ?
    `pgp-key${commonName}.pem` :
  outputType === "OpenSSH Public Key" ?
    `ssh-public-key${commonName}.txt` :
  outputType === "OpenSSH Private Key" ?
    `ssh-private-key${commonName}.ppk` : undefined;
}

export const DerivedFromRecipeView = observer( ({state, allowUserToChangeOutputType}: {
    state: DerivedFromRecipeState,
    allowUserToChangeOutputType: boolean
  }) => {
  const {recipeState, derivedValue} = state;
  const {type, outputFormat} = state.secretTypeAndOutputType ?? {};
  // const outputType = type != null ? state.outputFieldForType[type] : undefined;
  const fileName = recipeStateToFileName(state);
  return (
    <>
      { derivedValue != null && state.showQrCode ? (
        <QrCodeOverlayView state={new QrCodeOverlayState(state.setShowQrCodeOff, derivedValue)} />
      ) : null }
      <DerivedValueHeaderDiv>
        { allowUserToChangeOutputType ? (<SelectDerivedOutputType state={state} />) : null }
        { type == null || derivedValue == null ? null : (
          <HeaderButtonBar>
            <CharButton
                $invisible={derivedValue == null || type == null}
                onClick={() => copyToClipboard(derivedValue)}
              >&#128203;<CharButtonToolTip>Copy {(outputFormat ?? "").toLocaleLowerCase()} to clipboard</CharButtonToolTip>
            </CharButton>
            <CharButton
                $invisible={derivedValue == null || type == null}
                onClick={state.setShowQrCodeOn}
              ><img src={QrCodeSvg} style={{height: `1rem`}}></img><CharButtonToolTip>Display {(outputFormat ?? "").toLocaleLowerCase()} as QR code</CharButtonToolTip>
            </CharButton>
            <SecretFieldsCommonObscureButton diceKeyOrCenterLetterAndDigit={state.diceKey} />
            { (RUNNING_IN_ELECTRON && fileName != null) ? (
              <CharButton
                onClick={() => derivedValue && electronBridge.saveUtf8File({
                  content: derivedValue,
                  fileName
                })}
              >&darr;<CharButtonToolTip>save to file</CharButtonToolTip></CharButton>
            ): null}
          </HeaderButtonBar>
        )}
      </DerivedValueHeaderDiv>
      { type === "Secret" && outputFormat === "BIP39" && derivedValue != null ?
        (<Bip39OutputView bip39String={derivedValue} obscureValue={ HideRevealSecretsState.shouldSecretsDerivedFromDiceKeyBeHidden(state.diceKey) === true } />)
        : (
        <DerivedValueContentDiv>
          { !recipeState.recipeIsValid ? (
            <PlaceholderDerivedValueContainer>
              A {describeRecipeType(recipeState.type)} to be created by applying a recipe to your DiceKey
            </PlaceholderDerivedValueContainer>
          ) : (
            <OptionallyObscuredTextView value={derivedValue} obscureValue={ HideRevealSecretsState.shouldSecretsDerivedFromDiceKeyBeHidden(state.diceKey) === true } />
          )}
        </DerivedValueContentDiv>
      )}
    </>
  );
  }
);
