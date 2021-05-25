import React from "react";
import { DiceKey, PartialDiceKey, FaceComparisonErrorTypes } from "../../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import { ScanDiceKeyView } from "../LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import { AndClause } from "../basics";

export interface ModifiableDiceKeyState {
  diceKey?: DiceKey;
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
  onScanned = action( (diceKey: DiceKey) => {
    if (this.scanning === "backup") {
      this.setDiceKeyScannedFromBackup(diceKey);
    } else if (this.scanning === "original") {
      this.diceKeyState.setDiceKey(diceKey)
    }
    this.stopScanning();
  })

  get differencesBetweenOriginalAndBackup() { return this.diceKeyScannedFromBackup ? this.diceKeyState.diceKey?.compareTo(this.diceKeyScannedFromBackup) : undefined }
  get backupScannedSuccessfully() { return this.diceKeyScannedFromBackup && this.differencesBetweenOriginalAndBackup?.errors.length === 0 }
  get diceKeyScannedFromBackupAtRotationWithFewestErrors() {
    return this.differencesBetweenOriginalAndBackup?.otherDiceKeyRotated
  }
  get numberOfFacesWithErrors() {
    return this.differencesBetweenOriginalAndBackup?.errors.length ?? 0
  }

  _errorIndex?: number;
  get errorIndex(): number | undefined {
    const differences = this.differencesBetweenOriginalAndBackup;
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
    return this.errorIndex == null ? undefined : this.differencesBetweenOriginalAndBackup?.errors[this.errorIndex]
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
  get errorOriginalFace() { return this.diceKeyState.diceKey?.faces[this.errorFaceIndex ?? 0]}
  get errorBackupFace() { return this.differencesBetweenOriginalAndBackup?.otherDiceKeyRotated.faces[this.errorFaceIndex ?? 0]; }
 
}

export const ValidateBackupView  = observer ( ({state}: {state: ValidateBackupState}) => {
  const {
    diceKeyState,
    backupScannedSuccessfully,
    diceKeyScannedFromBackupAtRotationWithFewestErrors,
    differencesBetweenOriginalAndBackup,
    errorFaceIndex,
    causeOfError,
  } = state;
  if (state.scanning) {
    return (<>
      <ScanDiceKeyView onDiceKeyRead={ state.onScanned } />
      <button onClick={state.stopScanning} >Stop scanning</button>
    </>)
  } else {
    return (<>
      <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems:"center", marginRight: "1rem"}} >
          <DiceKeyViewAutoSized faces={diceKeyState.diceKey?.faces}
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={errorFaceIndex}
            />
          <button style={{marginTop: ".25rem"}} onClick={state.startScanningOriginal}>Re-scan your original DiceKey</button>  
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems:"center", marginLeft: "1rem"}} >
          <DiceKeyViewAutoSized faces={diceKeyScannedFromBackupAtRotationWithFewestErrors?.faces ?? [] as unknown as PartialDiceKey }
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={errorFaceIndex}
          />
          <button style={{marginTop: ".25rem"}}  onClick={state.startScanningBackup} >{
            state.diceKeyScannedFromBackup == null ? (<>Scan backup to verify</>) : (<>Re-scan Backup</>)
          }</button>  

        </div>
      </div>
      <div style={{fontSize: "1.25rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline",
        marginTop: "0.75rem",
        marginBottom: "0.5rem",
      }}>
        { backupScannedSuccessfully ? (<>Well done. The backup matches the original.</>) : null }
        { (differencesBetweenOriginalAndBackup?.errors.length ?? 0) <= 5 ? null :
            (<div style={{display: "block"}}>The backup doesn't look anything like the original.<br/></div>)
        }{ (errorFaceIndex == null || causeOfError == null) ? null :
            (<>Mismatch of&nbsp;<i><AndClause items={causeOfError} /></i> &nbsp;at the {state.errorRowName} row, {state.errorColumnName} column.</>)
        }
      </div>
      { state.errorIndex == null || state.numberOfFacesWithErrors <= 1 ? null : (
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center",
            marginBottom: "0.5rem",
          }}>
          <div style={{minWidth: "10vw"}}>
            <button
              style={{marginRight: "1rem"}}
              hidden={state.errorIndex == 0}
              onClick={() => state.setErrorIndex((state.errorIndex ?? 1) - 1)}
              >previous
            </button>
          </div>
          <div style={{minWidth: "20vw", fontSize: "1.1rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline"}}>
            Error {state.errorIndex + 1} of {state.numberOfFacesWithErrors}
          </div>
          <div style={{minWidth: "10vw"}}>
            <button
              style={{marginLeft: "1rem"}}
              hidden={state.errorIndex >= state.numberOfFacesWithErrors - 1 }
              onClick={() => state.setErrorIndex((state.errorIndex ?? 0) + 1)}
            >next
            </button>
          </div>
        </div>
      )}

    </>)
  }
});
