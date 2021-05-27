import { DiceKey, FaceComparisonErrorTypes } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { SettableDiceKeyState } from "./DiceKeyState";


export class ValidateBackupState {
  constructor(
    public readonly diceKeyState: SettableDiceKeyState,
    public readonly backupDiceKeyState: SettableDiceKeyState
  ) {
    makeAutoObservable(this);
  }

  get diceKey() { return this.diceKeyState.diceKey }
  get diceKeyScannedFromBackup() { return this.backupDiceKeyState.diceKey }


  get differencesBetweenOriginalAndBackup() { return this.diceKeyScannedFromBackup ? this.diceKeyState.diceKey?.compareTo(this.diceKeyScannedFromBackup) : undefined }
  get backupScannedSuccessfully() { return this.diceKeyScannedFromBackup && this.differencesBetweenOriginalAndBackup?.errors.length === 0 }
  get diceKeyScannedFromBackupAtRotationWithFewestErrors() {
    return this.differencesBetweenOriginalAndBackup?.otherDiceKeyRotated
  }
  get numberOfFacesWithErrors() {
    return this.differencesBetweenOriginalAndBackup?.errors.length ?? 0
  }

}

export class ValidateBackupViewState {
  constructor(
    public validationState: ValidateBackupState
  ) {
    makeAutoObservable(this);
  }

  clear = action ( () => {
    this.scanning = undefined;
    this._errorIndex = undefined;
  })

  scanning?: "original" | "backup";
  setScanning = (to?: "original" | "backup") => action( () => this.scanning = to );
  startScanningOriginal = this.setScanning("original");
  startScanningBackup = this.setScanning("backup");
  stopScanning = this.setScanning(undefined);

  onScanned = action( (diceKey: DiceKey) => {
    if (this.scanning === "backup") {
      this.validationState.backupDiceKeyState.setDiceKey(diceKey);
    } else if (this.scanning === "original") {
      this.validationState.diceKeyState.setDiceKey(diceKey)
    }
    this.stopScanning();
  });

  _errorIndex?: number;
  get errorIndex(): number | undefined {
    const differences = this.validationState.differencesBetweenOriginalAndBackup;
    const numDifferences = differences?.errors.length ?? 0;
    if (numDifferences === 0) return;
    const index = this._errorIndex;
    return index == null ? 0 :
      index < 0 ? 0 :
      index > numDifferences - 1 ? numDifferences - 1 :
      index;
  }
  setErrorIndex = action( (errorIndex: number) => this._errorIndex = errorIndex );


  get error() {
    return this.errorIndex == null ? undefined : this.validationState.differencesBetweenOriginalAndBackup?.errors[this.errorIndex]
  }
  get causeOfError() {
    const {error} = this;
    if (error == null) return undefined;
    const {index, ...errorObject} = error;
    return (Object.keys(errorObject) as (keyof FaceComparisonErrorTypes)[])
      .map( k => k === "orientationAsLowercaseLetterTrbl" ? "orientation" : k )
  }
  get errorFaceIndex() { return this.error?.index }
  get errorRowIndex() { return Math.floor((this.errorFaceIndex ?? 0) / 5) }
  get errorColumnIndex() { return (this.errorFaceIndex ?? 0) % 5 }
  get errorRowName() { return ["top", "second", "third", "fourth", "bottom"][this.errorRowIndex] }
  get errorColumnName() { return ["leftmost", "second", "third", "fourth", "rightmost"][this.errorColumnIndex]  }
  get errorOriginalFace() { return this.validationState.diceKey?.faces[this.errorFaceIndex ?? 0]}
  get errorBackupFace() { return this.validationState.differencesBetweenOriginalAndBackup?.otherDiceKeyRotated.faces[this.errorFaceIndex ?? 0]; }
}
