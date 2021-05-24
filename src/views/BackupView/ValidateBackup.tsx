import React from "react";
import { DiceKey, PartialDiceKey } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import { ScanDiceKeyView } from "../LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";

export interface ModifiableDiceKeyState {
  diceKey: DiceKey;
  setDiceKey: (diceKey?: DiceKey) => any
}

export class ValidateBackupState {
  constructor(public readonly diceKeyState: ModifiableDiceKeyState) {
    makeAutoObservable(this);
  }
  scanning?: "original" | "backup";
  setScanning = (to?: "original" | "backup") => action( () => this.scanning = to );
  startScanningOriginal = this.setScanning("original");
  startScanningBackup = this.setScanning("backup");
  stopScanning = this.setScanning(undefined); 
  diceKeyScannedFromBackup?: DiceKey;
  setDiceKeyScannedFromBackup = action( (diceKey?: DiceKey) => {
    this.diceKeyScannedFromBackup = diceKey;
  });
  onScanned = action( (diceKey?: DiceKey) => {
    if (this.scanning === "backup") {
      this.setDiceKeyScannedFromBackup(diceKey);
    } else if (this.scanning === "original" && diceKey != null) {
      this.diceKeyState.setDiceKey(diceKey)
    }
    this.stopScanning();
  })

  get differencesBetweenOriginalAndBackup() { return this.diceKeyScannedFromBackup ? this.diceKeyState.diceKey.compareTo(this.diceKeyScannedFromBackup) : undefined }
  get backupScannedSuccessfully() { return this.diceKeyScannedFromBackup && this.differencesBetweenOriginalAndBackup?.errors.length === 0 }
  get diceKeyScannedFromBackupAtRotationWithFewestErrors() {
    return this.differencesBetweenOriginalAndBackup?.otherDiceKeyRotated
  }
}

export const ValidateBackupView  = observer ( ({state}: {state: ValidateBackupState}) => {
  const {
    diceKeyState,
    backupScannedSuccessfully,
    diceKeyScannedFromBackupAtRotationWithFewestErrors,
    differencesBetweenOriginalAndBackup,
  } = state;
  if (state.scanning) {
    return (<>
      <ScanDiceKeyView onDiceKeyRead={ state.onScanned } />
      <button onClick={state.stopScanning} >Stop scanning</button>
    </>)
  } else {
    return (<>
      <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <DiceKeyViewAutoSized faces={diceKeyState.diceKey.faces}
          aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
          />
        <DiceKeyViewAutoSized faces={diceKeyScannedFromBackupAtRotationWithFewestErrors?.faces ?? [] as unknown as PartialDiceKey }
          // style={{width: "calc(min(40vh, 30vw)", height: "calc(min(40vh, 30vw)"}}
          aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
        />
      </div>
      { backupScannedSuccessfully ? (<>Success!</>) :
        (differencesBetweenOriginalAndBackup?.errors.length ?? 0) > 5 ?
          (<>The backup doesn't look anything like the original.</>) :
          (<>First error at { differencesBetweenOriginalAndBackup?.errors[0].index }</>)
      }

      <button onClick={state.startScanningOriginal}>Re-scan your original DiceKey</button>  
      <button onClick={state.startScanningBackup} >{
        state.diceKeyScannedFromBackup == null ? (<>Scan backup to verify</>) : (<>Re-scan Backup</>)
      }</button>  
    </>)
  }
});