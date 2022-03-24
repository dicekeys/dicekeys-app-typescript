import { DiceKey, DiceKeyComparisonResult, DiceKeyWithKeyId, FaceComparisonErrorTypes } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
// import { SettableDiceKeyState } from "../../state/Window/DiceKeyState";

export class FaceErrorDescriptor<T extends DiceKey = DiceKey> {
  constructor(
    private readonly diceKey: DiceKey,
    private readonly diceKeyComparisonResult: DiceKeyComparisonResult<T>,
    private readonly errorIndex: number,
  ) {
    makeAutoObservable(this)
  }

  get error() {
    return this.diceKeyComparisonResult?.errors[this.errorIndex]
  }

  get cause() {
    const {error} = this;
    if (error == null) return [];
    const {index, ...errorObject} = error;
    return (Object.keys(errorObject) as (keyof FaceComparisonErrorTypes)[])
      .map( k => k === "orientationAsLowercaseLetterTrbl" ? "orientation" : k )
  }
  get faceIndex() { return this.error?.index }
  get rowIndex() { return Math.floor((this.faceIndex ?? 0) / 5) }
  get columnIndex() { return (this.faceIndex ?? 0) % 5 }
  get rowName() { return ["top", "second", "third", "fourth", "bottom"][this.rowIndex] }
  get columnName() { return ["leftmost", "second", "third", "fourth", "rightmost"][this.columnIndex]  }
  get originalFace() { return this.diceKey?.faces[this.faceIndex ?? 0]}
  get backupFace() { return this.diceKeyComparisonResult?.otherDiceKeyRotated.faces[this.faceIndex ?? 0]; }
}

export class ValidateBackupViewState {
  constructor(
    diceKey: DiceKeyWithKeyId,
    public readonly diceKeyScannedFromBackupState: SettableDiceKeyState
  ) {
    this._diceKey = diceKey;
    makeAutoObservable(this);
  }

  private _diceKey: DiceKeyWithKeyId;
  get diceKey(): DiceKeyWithKeyId { return this._diceKey; }
  setDiceKey = action ( (diceKey: DiceKeyWithKeyId) => this._diceKey = diceKey )

  clear = action ( () => {
    this.scanning = undefined;
    this.errorIndex = undefined;
  })

  scanning?: "original" | "backup";
  setScanning = (to?: "original" | "backup") => action( () => this.scanning = to );
  startScanningOriginal = this.setScanning("original");
  startScanningBackup = this.setScanning("backup");
  stopScanning = this.setScanning(undefined);

  errorIndex: number | undefined;
  setErrorIndex = action( (errorIndex: number) => this.errorIndex = errorIndex );

  get diceKeyComparisonResult() { 
    const diceKeyScannedFromBackup = this.diceKeyScannedFromBackupState.diceKey;
    if (diceKeyScannedFromBackup == null) return;
    return this.diceKey?.compareTo(diceKeyScannedFromBackup);
  }
  get backupScannedSuccessfully() { return this.diceKeyComparisonResult?.errors.length === 0 }

  /** The scanned DiceKey rotated to the orientation that yields the fewest errors */
  get diceKeyScanned() {
    return this.diceKeyComparisonResult?.otherDiceKeyRotated
  }

  get numberOfFacesWithErrors() { 
    return this.diceKeyComparisonResult?.errors.length ?? 0
  }

  get errorDescriptor() {
    const {diceKey} = this;
    const {errorIndex = 0} = this; 
    if (diceKey == null || this.diceKeyComparisonResult == null ||
      errorIndex < 0 || errorIndex >= this.diceKeyComparisonResult.errors.length
    )
    return undefined;
    return new FaceErrorDescriptor(diceKey, this.diceKeyComparisonResult, errorIndex); }
}
