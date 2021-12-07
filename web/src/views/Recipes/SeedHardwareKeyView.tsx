import React, { useEffect, useState } from "react";
import { observer  } from "mobx-react";
import { CenteredControls, Instruction, Spacer, SecretFieldsCommonObscureButton, CopyButton } from "../basics";
import { RUNNING_IN_BROWSER, RUNNING_IN_ELECTRON } from "../../utilities/is-electron";
import { RecipeFieldEditorView, SequenceNumberFormFieldValueView } from "./DerivationView/RecipeFieldEditorView";
import styled, { css } from "styled-components";
import { SeedableFIDOKeys } from "../../state/hardware/usb/SeedableFIDOKeys";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { cssCalcTyped, cssCalcInputExpr } from "../../utilities/cssCalc";
import { ObscureSecretFields } from "../../state/ToggleState";
import { WindowTopLevelNavigationState } from "../../views/WindowTopLevelNavigationState";
import { PrimaryView } from "../../css";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { BelowTopNavigationBarWithNoBottomBar } from "../../views/Navigation/TopNavigationBar";
import { SeedHardwareKeyViewState, SeedSource } from "./SeedHardwareKeyVIewState";
import { RecipeEditingMode } from "./RecipeBuilderState";
//import { ModalOverlayForDialogOrMessage } from "../../views/WithSelectedDiceKey/SelectedDiceKeyLayout";


const FieldRow = styled.div<{invisible?: boolean}>`
    ${ props => props.invisible ? css`visibility: hidden;` : ``}
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-top: 0.25vh;
`;

const FieldLabelWidth = `max(10rem, 10vw)`;
const FieldValueMargin = `0.5vw`;

const ValueColumnOnly = styled.div<{invisible?: boolean}>`
  ${ props => props.invisible ? css`visibility: hidden;` : ``}
  margin-left: ${cssCalcTyped(`${cssCalcInputExpr(FieldLabelWidth)} + 2 * ${cssCalcInputExpr(FieldValueMargin)}`)};
  margin-top: 2rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
`;
const ValueColumnOnlyContinued = styled(ValueColumnOnly)`
  margin-top: 0;
`;
const InlineWarning = styled.div`
  background-color: rgba(147, 140, 47, 0.2);
  padding: 0.25rem;
  border-radius: 0.25rem;
  margin-right: 5vw;
`;

const FieldLabel = styled.label`
  min-width: ${FieldLabelWidth};
  text-align: right;
  padding-right: ${FieldValueMargin};
  margin-right: ${FieldValueMargin};
  border-right: 1px rgba(128,128,128, 0.5) solid;
`;

const FieldValue = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding-left: 0.25rem;
`;

const TextInputFor64HexCharsFontSize = cssCalcTyped(
  `min( 1rem, 2 * ( ( 70vw - ${cssCalcInputExpr(FieldLabelWidth)}) / 64 ) )`
);

const TextInputFor64HexCharsBase = css`
  font-family: monospace;
  font-size: ${TextInputFor64HexCharsFontSize};
`

const TextInputFor64HexChars = styled.input.attrs( (_props) => ({
  type: "text",
  size: 64,
}))`
  ${ TextInputFor64HexCharsBase }
  ${ (props) => props.disabled === false ? css`user-select: all` : ``}
`


const ModalContent = styled.div`
  padding-left: 10vw;
  padding-right: 10vw;
`

export const CannotSeedSecurityKeysView = () => (
  <ValueColumnOnly>
    <InlineWarning>
      Web browsers currently prevent web-based applications from using USB to seed hardware security keys.
      <br/>
      To seed a security key, you'll need to use the DiceKeys app on Android, Windows, Linux, or MacOS.
    </InlineWarning>
  </ValueColumnOnly>
);


export const CountdownSecondsView = observer( ({startingSeconds, whenStarted}: {startingSeconds: number, whenStarted: number}) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval( () => setNow(Date.now()), 1000);
    return () => { clearInterval(interval)}
  });
  const secondsPassed = Math.floor((now - whenStarted) / 1000)
  return (<>{ Math.max(0, startingSeconds - secondsPassed) }</>);
});

const WriteInProgressView = () => (
  <ModalContent>
    <Spacer/>
    <Instruction>Press the button on your hardware key three times to complete the seeding process.</Instruction>
    <Instruction>You have <CountdownSecondsView startingSeconds={8} whenStarted={ Date.now() }/> seconds to do so.</Instruction>
    <Spacer/>
  </ModalContent>
);

const WriteErrorView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {
  const {writeError} = seedHardwareKeyViewState;
  if (writeError == null) return null;
  return (
    <ModalContent>
      <Spacer/>
      <Instruction>{( () => {
        switch(seedHardwareKeyViewState.writeError) {
          case "UserDidNotAuthorizeSeeding": return `Your hardware key reported that you did not triple-click the button in time. `
          case "KeyDoesNotSupportCommand": return "Your hardware key's firmware does not support seeding."
          case "KeyDoesNotSupportSeedingVersion": return `Your hardware key's firmware does not support this seeding command version.`
          case "KeyReportedInvalidLength": return `Your hardware key reported that the seed length was incorrect.`;
          default: return `Internal error ${seedHardwareKeyViewState.writeError}`;
        }
      })()}          
      </Instruction>
      <CenteredControls><button onClick={seedHardwareKeyViewState.resetWriteState } >Dismiss</button></CenteredControls>
    </ModalContent>
  )  
});

const WriteSucceededView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => (
      <ModalContent>
        <Spacer/>
        <Instruction>Your USB FIDO key reports that the seed was successfully written.</Instruction>
        { JSON.stringify( seedHardwareKeyViewState.writeError) }        
        <Spacer/>
        <CenteredControls><button onClick={seedHardwareKeyViewState.resetWriteState } >Done</button></CenteredControls>
        <Spacer/>
      </ModalContent>
    )  
);

export const SoloKeyValue = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState,
}) => {
  if (RUNNING_IN_BROWSER) {
    return (<FieldValue>Cannot connect to USB FIDO keys</FieldValue>)
  }
  const {seedableFidoKeys} = seedHardwareKeyViewState;
  const numberOfKeys = seedableFidoKeys.length;
  if (numberOfKeys === 0) {
    return (<FieldValue>Insert FIDO key into USB slot</FieldValue>)
  }
  // if (numberOfKeys === 1) {
  //   return (<>{ seedableFidoKeys[0].productName }</>)
  // }
  return (<FieldValue>
    <select onChange={(e) => seedHardwareKeyViewState.setSelectedFidoKeysProductName(e.target.value)} value={seedHardwareKeyViewState.seedableFidoKeySelected?.productName }>{
      seedableFidoKeys.map( seedableFidoKey => (
        <option key={seedableFidoKey.productName} value={seedableFidoKey.productName}>{seedableFidoKey.productName}</option>
      ))
    }</select>
  </FieldValue>);
});


// const opaqueCursorRectangleHtmlEntity = "&#x2588;";
const opaqueBlockCharacter = "█";
const obscureByReplacingOtherCharactersWithThisCharacter = opaqueBlockCharacter;
//const obscureByReplacingOtherCharactersWithThisCharacter = "*";
const obscureHex = (hexString: string, cursorPosition: number | undefined | null): string => {
  const length = hexString.length;
//  const cursorPositionOrEnd: number = Math.min(cursorPosition ?? hexString.length, hexString.length);
  const obscureString = [...Array(length).keys()].map( (_, index) => 
      ( cursorPosition == null || (index < (cursorPosition - 2)) || (index > (cursorPosition + 1)) ) ?
      obscureByReplacingOtherCharactersWithThisCharacter : " "
  ).join("");
  return obscureString;
}

const ObscureTextInputFor64HexChars = styled.input.attrs<{cursorPosition: number | undefined | null}>( (props) => ({
  type: "text",
  size: 64,
  disabled: true,
  readOnly: true,
  value: obscureHex(typeof props.value === "string" ? props.value : "", props.cursorPosition)
}))<{cursorPosition: number | undefined | null}>`
  ${ TextInputFor64HexCharsBase }
  pointer-events: none;
  position: absolute;
  z-index: 1;
  user-select: none;
  outline: none;
  margin: none;
  border: none;
  padding: none;
  background-color: transparent;
  border-color: transparent;
`;

const isHexChar = (c: string) =>
  ((c >= "a" && c <="f") || (c >= "A" && c <="F") || (c >= "0" && c <= "9"));

// const removeNonHexCharactersAndForceToLowerCase = (value: string) =>
//   value.toLowerCase().split("").map(
//     c => ((c >= "a" && c <="f") || (c >= "0" && c <= "9")) ? c : ""
//   ).join("");

const SeedFieldView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState,
}) => {
  const value = seedHardwareKeyViewState.seedInHexFormat;
  const diceKeyNickname = seedHardwareKeyViewState.diceKeyState?.diceKey?.nickname ?? "DiceKey";
  return (<>
    <ValueColumnOnly>
      {(seedHardwareKeyViewState.diceKeyState.diceKey == null) ? (<>
          Enter or Paste a Seed in Hex Format (or&nbsp;<a onClick={() => {}}>load a DiceKey to generate a seed</a>)
        </>) : (
        <select value={seedHardwareKeyViewState.seedSourceSelected} onChange={(e)=>seedHardwareKeyViewState.setSeedSourceSelected(e.target.value as SeedSource)}>
          <option value={SeedSource.EnteredManually}>Enter or paste a seed</option>
          <option value={SeedSource.GeneratedFromDefaultRecipe}>Derive seed from {diceKeyNickname} using the standard recipe</option>
          <option value={SeedSource.GeneratedFromCustomRecipe}>Derive seed from {diceKeyNickname} Using Custom Recipe</option>
        </select>
    )}
    </ValueColumnOnly>
    { seedHardwareKeyViewState.seedSourceSelected != SeedSource.GeneratedFromDefaultRecipe ? null : (
        <ValueColumnOnlyContinued>
        Sequence number <SequenceNumberFormFieldValueView state={seedHardwareKeyViewState.recipeBuilderState} />
      </ValueColumnOnlyContinued>)
    }
    <FieldRow>
      <FieldLabel>Seed</FieldLabel>
      <FieldValue>
        { ObscureSecretFields.value ? (<ObscureTextInputFor64HexChars value={value} cursorPosition={seedHardwareKeyViewState.seedInEditableHexFormatFieldCursorPosition} />) : null }
        <TextInputFor64HexChars
          disabled={seedHardwareKeyViewState.seedSourceSelected!==SeedSource.EnteredManually}
          value={value}
          onChange={(e)=>{
            seedHardwareKeyViewState.setSeedInHexFormatFieldValue(e.target.value);
            seedHardwareKeyViewState.updateCursorPositionForEvent(e);
          }}
          onMouseUp={seedHardwareKeyViewState.updateCursorPositionForEvent}
          onKeyDown={seedHardwareKeyViewState.updateCursorPositionForEvent}
          onKeyPress={e => {
            if (!isHexChar(e.key)) {
              e.preventDefault();
            }
          }}
          onKeyUp={seedHardwareKeyViewState.updateCursorPositionForEvent}
          onBlur={() => seedHardwareKeyViewState.setSeedInEditableHexFormatFieldCursorPosition(null)}
          onFocus={seedHardwareKeyViewState.updateCursorPositionForEvent}
        />
        <SecretFieldsCommonObscureButton />
        <CopyButton valueToCopy={seedHardwareKeyViewState.seedInHexFormat} />
      </FieldValue>
    </FieldRow>
  </>)
});


export const SeedHardwareKeySimpleView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {
  if (seedHardwareKeyViewState.writeInProgress) {
    return (<WriteInProgressView/>)
  } else if (seedHardwareKeyViewState.writeError != null) {
    return (<WriteErrorView {...{seedHardwareKeyViewState}} />)
  } else if (seedHardwareKeyViewState.writeSucceeded) {
    return (<WriteSucceededView {...{seedHardwareKeyViewState}} />)
  }
  return (
    <div>
      { seedHardwareKeyViewState.seedSourceSelected != SeedSource.GeneratedFromCustomRecipe ? null : (
        (<RecipeFieldEditorView state={seedHardwareKeyViewState.recipeBuilderState} />)
      )}
      { RUNNING_IN_ELECTRON ? null : (<CannotSeedSecurityKeysView/>) }
      <FieldRow>
        <FieldLabel>USB FIDO Key</FieldLabel>
        <SoloKeyValue {...{seedHardwareKeyViewState}} />
      </FieldRow>
      <SeedFieldView {...{seedHardwareKeyViewState}} />
      <ValueColumnOnly>
        <button disabled={!seedHardwareKeyViewState.readyToWrite} onClick={seedHardwareKeyViewState.write}>Write</button>
      </ValueColumnOnly>
    </div>
  )
});


export const SeedHardwareKeyView = observer ( ({diceKeyState}: {diceKeyState: DiceKeyState}) => {
  const seedableFidoKeys = new SeedableFIDOKeys();
  const seedHardwareKeyViewState = new SeedHardwareKeyViewState(seedableFidoKeys, diceKeyState);
  // FIXME
  seedHardwareKeyViewState.recipeBuilderState.setEditingMode(RecipeEditingMode.EditIncludingRawJson);
  useEffect( () => () => seedableFidoKeys.destroy() );  
  return (
//    <SeedHardwareKeyViewWithState {...{diceKey, seedHardwareKeyViewState, seedableFidoKeys}}/>
    <SeedHardwareKeySimpleView {...{seedHardwareKeyViewState}}/>
  )
});

export const SeedHardwareKeyPrimaryView = observer( ({windowNavigationState}: {windowNavigationState: WindowTopLevelNavigationState}) => {

  // const onDonePressedWithinEnterDiceKey = () => {
  //   const diceKey = state.enterDiceKeyState.diceKey;
  //   if (state.mode === "manual" &&  diceKey) {
  //     props.onDiceKeyRead(diceKey, "manual");
  //   }
  // }

  return (
    <PrimaryView>
      <SimpleTopNavBar title={"Seed a USB FIDO Security Key"} />
      <BelowTopNavigationBarWithNoBottomBar>
      {/*
        <a onClick={() => {
          windowNavigationState.navigateToLoadDiceKey()
        }}>Load DiceKey</a>
      */}
        <SeedHardwareKeyView diceKeyState={windowNavigationState.foregroundDiceKeyState} />
      </BelowTopNavigationBarWithNoBottomBar>
    </PrimaryView>
  )});