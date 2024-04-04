import React, { useEffect, useState } from "react";
import { observer  } from "mobx-react";
import { CenteredControls, Instruction2, Spacer, SecretFieldsCommonObscureButton, CopyButton } from "../basics";
import { RecipeFieldEditorView, SequenceNumberFormFieldValueView } from "./DerivationView/RecipeFieldEditorView";
import styled, { css } from "styled-components";
import { cssCalcTyped, cssExprWithoutCalc } from "../../utilities/cssCalc";
import { DivSupportingInvisible } from "../../css";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { StandardWidthBetweenSideMargins, WindowRegionBelowTopNavigationBarWithSideMargins } from "../Navigation/NavigationLayout";
import { SeedHardwareKeyViewState, SeedSource, fidoAccessDeniedByPlatform, fidoAccessRequiresWindowsAdmin } from "./SeedHardwareKeyViewState";
import { LoadDiceKeyContentPaneView } from "../../views/LoadingDiceKeys/LoadDiceKeyView";
import { AnchorButton } from "../../views/basics/AnchorButton";
import { ExternalLink } from "../../views/basics/ExternalLink";
import { HideRevealSecretsState } from "../../state/stores/HideRevealSecretsState";
import { rangeStartingAt0 } from "../../utilities/range";

const FieldRow = styled.div<{$invisible?: boolean}>`
    ${ props => props.$invisible ? css`visibility: hidden;` : ``}
    display: flex;
    flex-direction: row;
    justify-content: flex-start;
    align-items: center;
    margin-top: 0.25vh;
`;

const FieldLabelWidth = `4rem`;
const FieldValueMargin = `0.5vw`;

const ValueColumnOnly = styled.div<{$invisible?: boolean}>`
  ${ props => props.$invisible ? css`visibility: hidden;` : ``}
  margin-left: ${cssCalcTyped(`${cssExprWithoutCalc(FieldLabelWidth)} + ${cssExprWithoutCalc(FieldValueMargin)}`)};
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
`;

const FieldValue = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  padding-left: ${FieldValueMargin};
  border-left: 1px rgba(128,128,128, 0.5) solid;
`;

const FieldValueMeta = styled(FieldValue)`
  border-color: transparent;
`;

const bufferForButtonsOnRightSideOfField = `6rem`;
const TextInputFor64HexCharsFontSize = cssExprWithoutCalc(
  `min( 1rem, 1.65 * ( ( ${StandardWidthBetweenSideMargins} - ${FieldLabelWidth} - ${FieldValueMargin} - ${bufferForButtonsOnRightSideOfField}) / 64 ) )`
);
const CalcTextInputFor64HexCharsFontSize = cssCalcTyped(TextInputFor64HexCharsFontSize);


const TextInputFor64HexChars = styled.input.attrs( () => ({
  type: "text",
  size: 64,
}))`
  font-family: monospace;
  font-size: ${CalcTextInputFor64HexCharsFontSize};
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
      To write seed into a security key, you will need to use the DiceKeys app on Android, Windows, Linux, or MacOS.
    </InlineWarning>
  </ValueColumnOnly>
);


export const CannotSeedSecurityKeysWithoutAdminView = () => (
  <ValueColumnOnly>
    <InlineWarning>
      Windows applications can only seed hardware security keys when running as administrator.
      <br/>
      To write seed into a security key, you will need to run this application as administrator by right clicking on its icon and choosing the <i>run as administrator</i> option.
    </InlineWarning>
  </ValueColumnOnly>
);

export const RunAsAdministratorRequiredView = ({dismiss}: {dismiss: () => void}) => (
  <ModalContent>
      <Spacer/>
      <Instruction2>
        Windows applications can only seed hardware security keys when running as administrator.
      </Instruction2>
      <Instruction2>
        To write seed into a security key, you will need to run this application as administrator by right clicking on its icon and choosing the <i>run as administrator</i> option.
      </Instruction2>
      <CenteredControls><button onClick={dismiss} >Dismiss</button></CenteredControls>
    </ModalContent>
);

const SecondsToTripleClick = 8;

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
    <Instruction2>Press the button on your hardware key three times to complete the seeding process.</Instruction2>
    <Instruction2>You have <CountdownSecondsView startingSeconds={SecondsToTripleClick} whenStarted={ Date.now() }/> seconds to do so.</Instruction2>
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
      <Instruction2>{( () => {
        switch(seedHardwareKeyViewState.writeError) {
          case "UserDidNotAuthorizeSeeding": return `Your hardware key reported that you did not triple-click the button in time. `
          case "KeyDoesNotSupportCommand": return "Your hardware key's firmware does not support seeding."
          case "KeyDoesNotSupportSeedingVersion": return `Your hardware key's firmware does not support this seeding command version.`
          case "KeyReportedInvalidLength": return `Your hardware key reported that the seed length was incorrect.`;
          default: return `Internal error ${seedHardwareKeyViewState.writeError}`;
        }
      })()}          
      </Instruction2>
      <CenteredControls><button onClick={seedHardwareKeyViewState.resetWriteState } >Dismiss</button></CenteredControls>
    </ModalContent>
  )  
});

const WriteSucceededView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => (
      <ModalContent>
        <Spacer/>
        <Instruction2>Your USB FIDO key reports that the seed was successfully written.</Instruction2>
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
  if (fidoAccessDeniedByPlatform) {
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
  return (
    <FieldValue>
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
  const obscureString = rangeStartingAt0(length).map( (_, index) => 
      ( cursorPosition == null || (index < (cursorPosition - 2)) || (index > (cursorPosition + 1)) ) ?
      obscureByReplacingOtherCharactersWithThisCharacter : " "
  ).join("");
  return obscureString;
}

const ObscureTextInputFor64HexChars = styled(TextInputFor64HexChars).attrs<{cursorPosition: number | undefined | null}>( (props) => ({
  type: "text",
  size: 64,
  disabled: true,
  readOnly: true,
  value: obscureHex(typeof props.value === "string" ? props.value : "", props.cursorPosition)
}))<{cursorPosition: number | undefined | null}>`
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
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {
  const value = seedHardwareKeyViewState.seedInHexFormat;
  const diceKeyNickname = seedHardwareKeyViewState.diceKey?.nickname ?? "DiceKey";
  const shouldHideSeed = HideRevealSecretsState.shouldSecretsDerivedFromDiceKeyBeHidden(seedHardwareKeyViewState.diceKey) === true;
  console.log(`shouldHideSeed`, shouldHideSeed);
  return (<>
    <ValueColumnOnly>
      <FieldValueMeta>
      {(seedHardwareKeyViewState.diceKey == null) ? (<>
          Enter or paste a seed in hex format{
              (<>&nbsp;or&nbsp; <AnchorButton onClick={seedHardwareKeyViewState.startLoadDiceKey}>load a DiceKey to generate a seed</AnchorButton></>)
        }</>) : (
        <select value={seedHardwareKeyViewState.seedSourceSelected} onChange={(e)=>seedHardwareKeyViewState.setSeedSourceSelected(e.target.value as SeedSource)}>
          <option value={SeedSource.EnteredManually}>Enter or paste a seed</option>
          <option value={SeedSource.GeneratedFromDefaultRecipe}>Derive seed from {diceKeyNickname} using the standard recipe</option>
          <option value={SeedSource.GeneratedFromCustomRecipe}>Derive seed from {diceKeyNickname} using custom Recipe</option>
        </select>
    )}
      </FieldValueMeta>
    </ValueColumnOnly>
    { seedHardwareKeyViewState.seedSourceSelected != SeedSource.GeneratedFromDefaultRecipe ? null : (
        <ValueColumnOnlyContinued>
          <FieldValueMeta>
            Sequence number <SequenceNumberFormFieldValueView state={seedHardwareKeyViewState.recipeBuilderState} />
          </FieldValueMeta>
      </ValueColumnOnlyContinued>)
    }
    <FieldRow>
      <FieldLabel>Seed</FieldLabel>
      <FieldValue>
        { shouldHideSeed ?
            (<ObscureTextInputFor64HexChars value={value} cursorPosition={seedHardwareKeyViewState.seedInEditableHexFormatFieldCursorPosition} />) :
            null
        }
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
        <SecretFieldsCommonObscureButton diceKeyOrCenterLetterAndDigit={seedHardwareKeyViewState.diceKey} />
        <CopyButton valueToCopy={seedHardwareKeyViewState.seedInHexFormat} />
      </FieldValue>
    </FieldRow>
  </>)
});

const SmallNote = styled(DivSupportingInvisible)`
  margin-top: 0.5rem;
  font-size: 0.9rem;
`

export const SeedHardwareKeyContentView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {
  const {loadDiceKeyState} = seedHardwareKeyViewState;
  if (loadDiceKeyState != null) {
    return (
      <LoadDiceKeyContentPaneView
        onDiceKeyReadOrCancelled={ r => seedHardwareKeyViewState.onDiceKeyReadOrCancelled(r?.diceKey) }
        state={ loadDiceKeyState }
      />
    );
  } else if (seedHardwareKeyViewState.displayFidoAccessRequiresAdminModal) {
    return (<RunAsAdministratorRequiredView dismiss={seedHardwareKeyViewState.dismissAdminModal} />)
  } else if (seedHardwareKeyViewState.writeInProgress) {
    return (<WriteInProgressView/>)
  } else if (seedHardwareKeyViewState.writeError != null) {
    return (<WriteErrorView {...{seedHardwareKeyViewState}} />)
  } else if (seedHardwareKeyViewState.writeSucceeded) {
    return (<WriteSucceededView {...{seedHardwareKeyViewState}} />)
  }
  return (
    <div>
      { seedHardwareKeyViewState.seedSourceSelected === SeedSource.GeneratedFromCustomRecipe ? (
          <RecipeFieldEditorView state={seedHardwareKeyViewState.recipeBuilderState} />
      ): (<>
        <Instruction2>
          Seed a FIDO security key with a secret key and, if you lose or break it,
          you can create a replica by writing the same seed into a replacement key.  
        </Instruction2>
      </>)}
      <div style={{minHeight: '3vh'}}></div>
      {fidoAccessRequiresWindowsAdmin ? (<CannotSeedSecurityKeysWithoutAdminView/>) :
        fidoAccessDeniedByPlatform ? (<CannotSeedSecurityKeysView/>) :
        null
      }
      <FieldRow>
        <FieldLabel>USB Key</FieldLabel>
        <SoloKeyValue {...{seedHardwareKeyViewState}} />
      </FieldRow>
      <SeedFieldView {...{seedHardwareKeyViewState}} />
      <ValueColumnOnly>
        <div>
          <button disabled={!seedHardwareKeyViewState.readyToWrite} onClick={seedHardwareKeyViewState.write}>Write</button>
          <SmallNote $invisible={!seedHardwareKeyViewState.readyToWrite}>
            Note the location of the button on your USB Key.  Once you press <i>write</i>, you will have {SecondsToTripleClick.toString()} seconds to press the button on your key three times.
          </SmallNote>
          <SmallNote>Not all FIDO security keys support seeding. Seeding is currently only supported by&nbsp;
            <ExternalLink url="https://www.crowdsupply.com/dicekeys/dicekeys">these SoloKeys</ExternalLink>.
          </SmallNote>
        </div>
      </ValueColumnOnly>
    </div>
  )
});

export const SeedHardwareKeyFullPageView = observer( ({seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {
  return (
    <>
      <SimpleTopNavBar title={"Seed a USB FIDO Security Key"} />
      <WindowRegionBelowTopNavigationBarWithSideMargins>
        <SeedHardwareKeyContentView seedHardwareKeyViewState={seedHardwareKeyViewState} />
      </WindowRegionBelowTopNavigationBarWithSideMargins>
    </>
  )});