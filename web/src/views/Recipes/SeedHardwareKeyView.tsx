import React, { useEffect, useState } from "react";
import { observer  } from "mobx-react";
import { CenteredControls, Instruction, PaddedContentBox, Spacer, SecretFieldsCommonObscureButton } from "../basics";
import { DerivedFromRecipeView } from "./DerivedFromRecipeView";
import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import * as Dimensions from "./DerivationView/DerivationViewLayout";
import { writeSeedToFIDOKey, WriteSeedToFIDOKeyException } from "../../state/hardware/usb/SeedHardwareKey";
import { action, makeAutoObservable } from "mobx";
import { RUNNING_IN_ELECTRON, RUNNING_IN_BROWSER } from "../../utilities/is-electron";
import { LoadedRecipe } from "../../dicekeys/StoredRecipe";
import { RecipeFieldEditorView } from "./DerivationView/RecipeFieldEditorView";
import { KeyPlusRecipeView } from "./DerivationView/KeyPlusRecipeView";
import { DiceKey } from "../../dicekeys/DiceKey";
import styled, { css } from "styled-components";
import { SeedableFIDOKeys } from "../../state/hardware/usb/SeedableFIDOKeys";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { hexStringToUint8ClampedArray, uint8ArrayToHexString } from "../../utilities";
import { cssCalcTyped, cssCalcInputExpr } from "../../utilities/cssCalc";
import { ObscureSecretFields } from "../../state/ToggleState";
import { WindowTopLevelNavigationState } from "../../views/WindowTopLevelNavigationState";
import { PrimaryView } from "../../css";
import { SimpleTopNavBar } from "../../views/Navigation/SimpleTopNavBar";
import { BelowTopNavigationBarWithNoBottomBar } from "../../views/Navigation/TopNavigationBar";
//import { ModalOverlayForDialogOrMessage } from "../../views/WithSelectedDiceKey/SelectedDiceKeyLayout";

const seedSecurityKeyPurpose = "seedSecurityKey";

export const isUsbDeviceASeedableFIDOKey = ({vendorId, productId}: HIDDevice): boolean =>
  (vendorId == 0x10c4 && productId == 0x8acf) ||
  (vendorId == 0x0483 && productId == 0xa2ca);

export const FiltersForUsbDeviceASeedableFIDOKey: HIDDeviceFilter[] = [
  {vendorId: 0x10c4, productId: 0x8acf},
  {vendorId: 0x0483, productId: 0xa2ca},
];

// const NoSoloKeysAttachedDiv = styled(ModalOverlayForDialogOrMessage)`
// `


export const CannotSeedSecurityKeysView = () => (
  <SeedingContentBlockDiv>
    Web browsers currently prevent web-based applications from using USB to seed hardware security keys.
    <br/>
    To seed a security key, you'll need to use the DiceKeys app on Android, Windows, Linux, or MacOS.
  </SeedingContentBlockDiv>
);


export const NoSecurityKeysView = () => (
  <SeedingContentBlockDiv>
    Insert the SoloKey you wish to seed into a USB port. (None are currently attached.)
    <br/>
    Alternatively, you can generate a seed below and copy it to another device.
  </SeedingContentBlockDiv>
)



const SeedingContentBlockDiv = styled.div`
  background-color: rgba(147, 140, 47, 0.2);
  padding: 0.5rem;
  border-radius: 0.5rem;
  min-width: 60vw;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  overflow-wrap: anywhere;
`;

export const HardwareSecurityKeysView = observer ( ({seedableFidoKeys, seedHardwareKeyViewState}: {
  seedableFidoKeys: SeedableFIDOKeys,
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {
  const {devices} = seedableFidoKeys;
  if (devices == null) return null;
  if (devices.length === 0) return (<NoSecurityKeysView/>);
  return (
    <SeedingContentBlockDiv>
      { devices.map( device => (
        <button
          key={device.productName}
          onClick={ () => seedHardwareKeyViewState.write(device) }
        >Seed {device.productName}
        </button>
      ))}
    </SeedingContentBlockDiv>
  );
});
export const PressCountdownSecondsView = observer( ({whenStarted}: {whenStarted: number}) => {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const interval = setInterval( () => setNow(Date.now()), 1000);
    return () => { clearInterval(interval)}
  });
  const secondsPassed = Math.floor((now - whenStarted) / 1000)
  return (<>{ Math.max(0, 8 - secondsPassed) }</>);
})

export const SeedHardwareKeyViewWithState = observer( ( {diceKey, seedHardwareKeyViewState, seedableFidoKeys}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState,
  seedableFidoKeys: SeedableFIDOKeys,
  diceKey: DiceKey
}) => {
  const {derivedFromRecipeState} = seedHardwareKeyViewState;
  if (derivedFromRecipeState == null) return null;
  if (seedHardwareKeyViewState.writeInProgress) {
    return (
      <PaddedContentBox>
        <Spacer/>
        <Instruction>Press the button on your hardware key three times to complete the seeding process.</Instruction>
        <Instruction>You have <PressCountdownSecondsView whenStarted={ Date.now() }/> seconds to do so.</Instruction>
        <Spacer/>
      </PaddedContentBox>
    )  
  } else if (seedHardwareKeyViewState.writeError != null) {
    return (
      <PaddedContentBox>
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
        <Spacer/>
        <CenteredControls><button onClick={seedHardwareKeyViewState.resetWriteState } >Dismiss</button></CenteredControls>
      </PaddedContentBox>
    )  
  } else if (seedHardwareKeyViewState.writeSucceeded) {
    return (
      <PaddedContentBox>
        <Spacer/>
        <Instruction>Your key has been written.</Instruction>
        { JSON.stringify( seedHardwareKeyViewState.writeError) }        
        <Spacer/>
        <CenteredControls><button onClick={seedHardwareKeyViewState.resetWriteState } >Okay</button></CenteredControls>
      </PaddedContentBox>
    )  
  } else return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      justifySelf: "center",
    }}> 
      { RUNNING_IN_ELECTRON ? (
        <HardwareSecurityKeysView {...{seedableFidoKeys
      , seedHardwareKeyViewState}}/>
      ) : (
        <CannotSeedSecurityKeysView/>
      )}
      <div style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignContent: "flex-start",
        height: `${Dimensions.WizardOrFieldsMaxHeight}vh`,
      }}>
        <RecipeFieldEditorView state={seedHardwareKeyViewState.recipeBuilderState} />
      </div>
      <div style={{display: "flex",
        flexDirection: "column", 
        alignItems: "center", justifyContent: "flex-end"
      }}>
          <KeyPlusRecipeView {...{diceKey, recipeBuilderState: seedHardwareKeyViewState.recipeBuilderState}} />
      </div>
      <DerivedFromRecipeView allowUserToChangeOutputType={false} state={derivedFromRecipeState} />
    </div>
  )
});


enum SeedSource {
  GeneratedFromDefaultRecipe = "GeneratedFromDefaultRecipe",
  GeneratedFromCustomRecipe = "GeneratedFromCustomRecipe",
  EnteredManually = "EnteredManually"
}
// const SeedSources = [
//   SeedSource.EnteredManually,
//   SeedSource.GeneratedFromDefaultRecipe,
//   SeedSource.GeneratedFromCustomRecipe,
// ] as const;

class SeedHardwareKeyViewState {
  recipeBuilderState: RecipeBuilderState;
  diceKeyState: DiceKeyState;
  derivedFromRecipeState: DerivedFromRecipeState | undefined;

  _seedInEditableHexFormatFieldValue: string | undefined = undefined;
  get seedInEditableHexFormatFieldValue() {return this._seedInEditableHexFormatFieldValue}
  readonly setSeedInHexFormatFieldValue = action((newValue: string | undefined)=>{this._seedInEditableHexFormatFieldValue = newValue;});

  _seedInEditableHexFormatFieldCursorPosition: number | undefined | null;
  get seedInEditableHexFormatFieldCursorPosition() {return this._seedInEditableHexFormatFieldCursorPosition}
  readonly setSeedInEditableHexFormatFieldCursorPosition = action((newValue: number | undefined | null)=>{this._seedInEditableHexFormatFieldCursorPosition = newValue;});
  readonly updateCursorPositionForEvent = (e:  {currentTarget: HTMLInputElement}) => // React.ChangeEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement> | React.KeyboardEvent<HTMLInputElement>) =>
    this.setSeedInEditableHexFormatFieldCursorPosition(e.currentTarget.selectionStart)

  _seedSourceSelected: SeedSource | undefined = undefined;
  get seedSourceSelected(): SeedSource {
    return this.diceKeyState.diceKey == null ? SeedSource.EnteredManually :
      (this._seedSourceSelected ?? SeedSource.GeneratedFromDefaultRecipe);
  }
  readonly setSeedSourceSelected = action( (newValue: SeedSource | undefined)=>{
    if (newValue === SeedSource.EnteredManually) {
      const {seedInHexFormat} = this;
      if (seedInHexFormat.length > 0) {
        // Before we start editing, copy the current seed into the editable field
        this.setSeedInHexFormatFieldValue(seedInHexFormat);
      }
    }
    this._seedSourceSelected = newValue;
  });

  get seedInHexFormat(): string {
    const {seedSourceSelected} = this;
    if (seedSourceSelected === SeedSource.GeneratedFromDefaultRecipe || seedSourceSelected === SeedSource.GeneratedFromCustomRecipe) {
      return this.derivedFromRecipeState?.derivedValue ?? "";
    } else {
      return this.seedInEditableHexFormatFieldValue ?? "";
    }
  }

  get seed() {
    return hexStringToUint8ClampedArray(this.seedInHexFormat);
  }

  get seedIsValid() {
    return this.seed.length == 32 &&
    // Valid if re-encoded hex equal original hex
    uint8ArrayToHexString(Uint8Array.from(this.seed)).toLowerCase() === this.seedInHexFormat.toLowerCase();
  }
  
  private _selectedFidoKeysProductName: string | undefined;
  get selectedFidoKeysProductName() { return this._selectedFidoKeysProductName; }
  setSelectedFidoKeysProductName = action( (newSelectedFidoKeysProductName: string | undefined) => {
    this._selectedFidoKeysProductName = newSelectedFidoKeysProductName;
  });

  get seedableFidoKeys() {
    return this.seedableFidoKeysObserverClass.devices;
  }

  get seedableFidoKeySelected(): HIDDevice | undefined {
    const {selectedFidoKeysProductName, seedableFidoKeys} = this;
    return seedableFidoKeys.find( (device) => device.productName === selectedFidoKeysProductName ) ??
      seedableFidoKeys.at(0);
  }

  writeInProgress: boolean = false;
  writeSucceeded?: boolean;
  writeError?: WriteSeedToFIDOKeyException | undefined;
  resetWriteState = action ( () => {
    this.writeInProgress = false;
    this.writeError = undefined;
    this.writeSucceeded = undefined;
  });
  setWriteStarted = action ( () => {
    this.writeInProgress = true;
    this.writeError = undefined;
    this.writeSucceeded = undefined;
  });
  setWriteError = action ( (error: any) => {
    this.writeInProgress = false
    this.writeError = error;
    this.writeSucceeded = false;;
  });
  setWriteSucceeded = action ( () => {
    this.writeInProgress = false;
    this.writeError = undefined;
    this.writeSucceeded = true;
  });

  write = (device: HIDDevice) => {
    const seed = this.derivedFromRecipeState?.derivedSeedBytesHex;
    if (!seed) return;
    this.setWriteStarted();
    writeSeedToFIDOKey(device, seed)
      .then( () => this.setWriteSucceeded() )
      .catch ( this.setWriteError );
  }

  constructor(private readonly seedableFidoKeysObserverClass: SeedableFIDOKeys, diceKeyState: DiceKeyState) {
    const recipeBuilderState = new RecipeBuilderState({
      origin: "BuiltIn",
      type: "Secret",
      recipeJson: `{"purpose":"${seedSecurityKeyPurpose}"}`,
    } as LoadedRecipe<"BuiltIn">);
    this.recipeBuilderState = recipeBuilderState;
    this.diceKeyState = diceKeyState;
    this.derivedFromRecipeState = new DerivedFromRecipeState({recipeState: recipeBuilderState, diceKeyState });
    makeAutoObservable(this);
  }

}



// Add to menu bar: load new DiceKey
// Add to menu bar: Seed SoloKey

// SoloKey seeding screens
// Step 1: Seed/SoloKey
// SoloKey selector
// Sequence number field, validated to confirm it is 64 hex characters (32 bytes)
// Seed field: default seed if loaded (with sequence number)
// Edit/customize recipe button

// Step 2: Generate seed
// Step 3: Write/copy seed


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
  margin-top: 1rem;
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
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
`;

export const SoloKeyValue = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState,
}) => {
  if (RUNNING_IN_BROWSER) {
    return (<CannotSeedSecurityKeysView/>);
  }
  const {seedableFidoKeys} = seedHardwareKeyViewState;
  const numberOfKeys = seedableFidoKeys.length;
  if (numberOfKeys === 0) {
    return (<>Insert key</>)
  }
  // if (numberOfKeys === 1) {
  //   return (<>{ seedableFidoKeys[0].productName }</>)
  // }
  return (<>
    <select onChange={(e) => seedHardwareKeyViewState.setSelectedFidoKeysProductName(e.target.value)} value={seedHardwareKeyViewState.seedableFidoKeySelected?.productName }>{
      seedableFidoKeys.map( seedableFidoKey => (
        <option key={seedableFidoKey.productName} value={seedableFidoKey.productName}>{seedableFidoKey.productName}</option>
      ))
    }</select>
  </>);
});

const TextInputFor64HexCharsFontSize = cssCalcTyped(
  `min( 1rem, 2 * ( ( 80vw - ${cssCalcInputExpr(FieldLabelWidth)}) / 64 ) )`
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
  return (<>
    <ValueColumnOnly>
      {(seedHardwareKeyViewState.diceKeyState.diceKey == null) ? (<>
          Enter or Paste a Seed in Hex Format (or&nbsp;<a onClick={() => {}}>load a DiceKey to generate a seed</a>)
        </>) : (
        <select value={seedHardwareKeyViewState.seedSourceSelected} onChange={(e)=>seedHardwareKeyViewState.setSeedSourceSelected(e.target.value as SeedSource)}>
          <option value={SeedSource.EnteredManually}>Enter or Paste a Seed</option>
          <option value={SeedSource.GeneratedFromDefaultRecipe}>Derive Seed from DiceKey Using Standard Recipe</option>
          <option value={SeedSource.GeneratedFromCustomRecipe}>Derive Seed from DiceKey Using Custom Recipe</option>
        </select>
    )}
    </ValueColumnOnly>
    <FieldRow>
      <FieldLabel>Seed</FieldLabel>
      {/* (derived from your DiceKey with sequence number 1)
        If DiceKey loaded, NOT EDITABLE TO START
            Default seed generated from your DiceKey with no sequence number
              (add a sequence number to change the seed)
              (manually edit the recipe used to generate the seed (not recommended))
              (enter a seed manually)
              [obscure button needed, obscures all but the last two characters]
        
        If no DiceKey loaded, EDITABLE TO START
            Paste a seed, or load your DiceKey to generate the seed

        1. Make this field editable so I can paste or enter a seed
        1. Edit recipe to generate seed from your DiceKey
        2. Edit/paste seed
      */}
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
      </FieldValue>
    </FieldRow>
  </>)
});


export const SeedHardwareKeySimpleView = observer( ( {seedHardwareKeyViewState}: {
  seedHardwareKeyViewState: SeedHardwareKeyViewState
}) => {

  return (
    <div>
      <FieldRow>
        <FieldLabel>USB FIDO Key</FieldLabel>
        <SoloKeyValue {...{seedHardwareKeyViewState}} />
      </FieldRow>
      <SeedFieldView {...{seedHardwareKeyViewState}} />
      <ValueColumnOnly invisible={!seedHardwareKeyViewState.seedIsValid || seedHardwareKeyViewState.seedableFidoKeySelected == null}>
        <button>Write</button>
      </ValueColumnOnly>
    </div>
  )
});


export const SeedHardwareKeyView = observer ( ({diceKeyState}: {diceKeyState: DiceKeyState}) => {
  const seedableFidoKeys = new SeedableFIDOKeys();
  const seedHardwareKeyViewState = new SeedHardwareKeyViewState(seedableFidoKeys, diceKeyState);
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