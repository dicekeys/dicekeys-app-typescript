import React from "react";
import {ButtonsCSS} from "../../css"
import { DiceKey, PartialDiceKey } from "../../dicekeys/DiceKey";
import { observer } from "mobx-react";
import { ScanDiceKeyView } from "../LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import { AndClause, CenteredControls } from "../basics";
import { ValidateBackupViewState } from "./ValidateBackupViewState";

export const ValidateBackupView = observer ( ({viewState}: {viewState: ValidateBackupViewState}) => {
  const onDiceKeyRead = (diceKey: DiceKey) => {
    if (viewState.scanning === "backup") {
      viewState.diceKeyScannedFromBackupState.setDiceKey(diceKey);
    } else if (viewState.scanning === "original") {
      viewState.diceKeyState.setDiceKey(diceKey)
    }
    viewState.stopScanning();
  };
  if (viewState.scanning) {
    return (<>
      <ScanDiceKeyView onDiceKeyRead={ onDiceKeyRead } />
      <CenteredControls>
          <button className={ButtonsCSS.PushButton} onClick={viewState.stopScanning} >Stop scanning</button>
      </CenteredControls>
    </>)
  } else {
    return (<>
      <div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems:"center", marginRight: "1rem"}} >
          <DiceKeyViewAutoSized faces={viewState.diceKeyState.diceKey?.faces}
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={viewState.errorDescriptor.faceIndex}
            />
          <CenteredControls>
            <button className={ButtonsCSS.PushButton} onClick={viewState.startScanningOriginal}>Re-scan your original DiceKey</button>
          </CenteredControls>
        </div>
        <div style={{display: "flex", flexDirection: "column", justifyContent: "flex-start", alignItems:"center", marginLeft: "1rem"}} >
          <DiceKeyViewAutoSized faces={viewState.diceKeyScanned?.faces ?? [] as unknown as PartialDiceKey }
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={viewState.errorDescriptor.faceIndex}
          />
          <CenteredControls>
            <button className={ButtonsCSS.PushButton}  onClick={viewState.startScanningBackup} >{
              viewState.diceKeyScannedFromBackupState.diceKey == null ? (<>Scan backup to verify</>) : (<>Re-scan Backup</>)
            }</button>  
          </CenteredControls>

        </div>
      </div>
      <div style={{fontSize: "1.25rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline",
        marginTop: "0.75rem",
        marginBottom: "0.5rem",
      }}>
        { viewState.backupScannedSuccessfully ? (<>Well done. The backup matches the original.</>) : null }
        { (viewState.diceKeyComparisonResult?.errors.length ?? 0) <= 5 ? null :
            (<div style={{display: "block"}}>The backup doesn't look anything like the original.<br/></div>)
        }{ (viewState.errorDescriptor.faceIndex == null || viewState.errorDescriptor.cause == null) ? null :
            (<>Mismatch of&nbsp;<i><AndClause items={viewState.errorDescriptor.cause} /></i> &nbsp;at the {viewState.errorDescriptor.rowName} row, {viewState.errorDescriptor.columnName} column.</>)
        }
      </div>
      { viewState.errorIndex == null || viewState.numberOfFacesWithErrors <= 1 ? null : (
        <div style={{display: "flex", flexDirection: "row", justifyContent: "center",
            marginBottom: "0.5rem",
          }}>
          <div style={{minWidth: "10vw"}}>
            <button
              className={ButtonsCSS.PushButton}
              hidden={viewState.errorIndex == 0}
              onClick={() => viewState.setErrorIndex((viewState.errorIndex ?? 1) - 1)}
              >previous
            </button>
          </div>
          <div style={{minWidth: "20vw", fontSize: "1.1rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline"}}>
            Error {viewState.errorIndex + 1} of {viewState.numberOfFacesWithErrors}
          </div>
          <div style={{minWidth: "10vw"}}>
            <button
              className={ButtonsCSS.PushButton}
              hidden={viewState.errorIndex >= viewState.numberOfFacesWithErrors - 1 }
              onClick={() => viewState.setErrorIndex((viewState.errorIndex ?? 0) + 1)}
            >next
            </button>
          </div>
        </div>
      )}

    </>)
  }
});
