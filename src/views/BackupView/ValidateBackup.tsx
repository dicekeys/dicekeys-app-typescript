import React from "react";
import {  PartialDiceKey } from "../../dicekeys/DiceKey";
import { observer } from "mobx-react";
import { ScanDiceKeyView } from "../LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import { AndClause } from "../basics";
import { ValidateBackupViewState } from "../../state/Window/BackupValidationState";

export const ValidateBackupView = observer ( ({viewState}: {viewState: ValidateBackupViewState}) => {
  const {validationState} = viewState;
  if (viewState.scanning) {
    return (<>
      <ScanDiceKeyView onDiceKeyRead={ viewState.onScanned } />
      <button onClick={viewState.stopScanning} >Stop scanning</button>
    </>)
  } else {
    return (<>
      <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems:"center", marginRight: "1rem"}} >
          <DiceKeyViewAutoSized faces={validationState.diceKey?.faces}
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={viewState.errorFaceIndex}
            />
          <button style={{marginTop: ".25rem"}} onClick={viewState.startScanningOriginal}>Re-scan your original DiceKey</button>  
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems:"center", marginLeft: "1rem"}} >
          <DiceKeyViewAutoSized faces={validationState.diceKeyScannedFromBackupAtRotationWithFewestErrors?.faces ?? [] as unknown as PartialDiceKey }
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={viewState.errorFaceIndex}
          />
          <button style={{marginTop: ".25rem"}}  onClick={viewState.startScanningBackup} >{
            validationState.diceKeyScannedFromBackup == null ? (<>Scan backup to verify</>) : (<>Re-scan Backup</>)
          }</button>  

        </div>
      </div>
      <div style={{fontSize: "1.25rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline",
        marginTop: "0.75rem",
        marginBottom: "0.5rem",
      }}>
        { validationState.backupScannedSuccessfully ? (<>Well done. The backup matches the original.</>) : null }
        { (validationState.differencesBetweenOriginalAndBackup?.errors.length ?? 0) <= 5 ? null :
            (<div style={{display: "block"}}>The backup doesn't look anything like the original.<br/></div>)
        }{ (viewState.errorFaceIndex == null || viewState.causeOfError == null) ? null :
            (<>Mismatch of&nbsp;<i><AndClause items={viewState.causeOfError} /></i> &nbsp;at the {viewState.errorRowName} row, {viewState.errorColumnName} column.</>)
        }
      </div>
      { viewState.errorIndex == null || validationState.numberOfFacesWithErrors <= 1 ? null : (
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center",
            marginBottom: "0.5rem",
          }}>
          <div style={{minWidth: "10vw"}}>
            <button
              style={{marginRight: "1rem"}}
              hidden={viewState.errorIndex == 0}
              onClick={() => viewState.setErrorIndex((viewState.errorIndex ?? 1) - 1)}
              >previous
            </button>
          </div>
          <div style={{minWidth: "20vw", fontSize: "1.1rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline"}}>
            Error {viewState.errorIndex + 1} of {validationState.numberOfFacesWithErrors}
          </div>
          <div style={{minWidth: "10vw"}}>
            <button
              style={{marginLeft: "1rem"}}
              hidden={viewState.errorIndex >= validationState.numberOfFacesWithErrors - 1 }
              onClick={() => viewState.setErrorIndex((viewState.errorIndex ?? 0) + 1)}
            >next
            </button>
          </div>
        </div>
      )}

    </>)
  }
});
