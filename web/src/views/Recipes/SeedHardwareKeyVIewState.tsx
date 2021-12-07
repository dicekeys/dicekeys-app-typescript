import { RecipeBuilderState } from "./RecipeBuilderState";
import { DerivedFromRecipeState } from "./DerivedFromRecipeState";
import { writeSeedToFIDOKey, WriteSeedToFIDOKeyException } from "../../state/hardware/usb/SeedHardwareKey";
import { action, makeAutoObservable } from "mobx";
import { LoadedRecipe } from "../../dicekeys/StoredRecipe";
import { SeedableFIDOKeys } from "../../state/hardware/usb/SeedableFIDOKeys";
import { DiceKeyState } from "../../state/Window/DiceKeyState";
import { hexStringToUint8ClampedArray, uint8ArrayToHexString } from "../../utilities";

const seedSecurityKeyPurpose = "seedSecurityKey";

export const isUsbDeviceASeedableFIDOKey = ({vendorId, productId}: HIDDevice): boolean =>
  (vendorId == 0x10c4 && productId == 0x8acf) ||
  (vendorId == 0x0483 && productId == 0xa2ca);

export const FiltersForUsbDeviceASeedableFIDOKey: HIDDeviceFilter[] = [
  {vendorId: 0x10c4, productId: 0x8acf},
  {vendorId: 0x0483, productId: 0xa2ca},
];

export enum SeedSource {
  GeneratedFromDefaultRecipe = "GeneratedFromDefaultRecipe",
  GeneratedFromCustomRecipe = "GeneratedFromCustomRecipe",
  EnteredManually = "EnteredManually"
}
// const SeedSources = [
//   SeedSource.EnteredManually,
//   SeedSource.GeneratedFromDefaultRecipe,
//   SeedSource.GeneratedFromCustomRecipe,
// ] as const;

export class SeedHardwareKeyViewState {
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

  get allFieldsValid(): boolean {
    return this.seedIsValid && this.seedableFidoKeySelected != null
  }

  get readyToWrite(): boolean {
    return this.allFieldsValid && !this.writeInProgress;
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

  write = () => {
    const device = this.seedableFidoKeySelected;
    const seed = this.derivedFromRecipeState?.derivedSeedBytesHex;
    if (!device || !seed) return;
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
