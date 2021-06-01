import React from "react";
import css from "./BackupView.module.css";
import {ButtonsCSS} from "../../css"
import { DiceKey, PartialDiceKey } from "../../dicekeys/DiceKey";
import { observer } from "mobx-react";
import { ScanDiceKeyView } from "../LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyViewAutoSized } from "../SVG/DiceKeyView";
import { AndClause, CenteredControls, ContentBox, ContentRow, Instruction, Spacer } from "../basics";
import { ValidateBackupViewState, FaceErrorDescriptor } from "./ValidateBackupViewState";

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
      <ScanDiceKeyView
        maxWidth="80vw"
        maxHeight="50vh"      
        onDiceKeyRead={ onDiceKeyRead }
      />
      <CenteredControls>
          <button className={ButtonsCSS.PushButton} onClick={viewState.stopScanning} >Stop scanning</button>
      </CenteredControls>
    </>)
  } else {
    return (<>
      <ContentRow>
        <div className={css.ComparisonBox}>
          <DiceKeyViewAutoSized faces={viewState.diceKeyState.diceKey?.faces}
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={viewState.errorDescriptor?.faceIndex}
            />
          <CenteredControls>
            <button className={ButtonsCSS.PushButton} onClick={viewState.startScanningOriginal}>Re-scan your original DiceKey</button>
          </CenteredControls>
        </div>
        <div className={css.ComparisonBox} >
          <DiceKeyViewAutoSized faces={viewState.diceKeyScanned?.faces ?? [] as unknown as PartialDiceKey }
            aspectRatioWidthOverHeight={1} maxWidth={"35vw"} maxHeight={"40vh"}
            highlightFaceAtIndex={viewState.errorDescriptor?.faceIndex}
          />
          <CenteredControls>
            <button className={ButtonsCSS.PushButton}  onClick={viewState.startScanningBackup} >{
              viewState.diceKeyScannedFromBackupState.diceKey == null ? (<>Scan backup to verify</>) : (<>Re-scan Backup</>)
            }</button>  
          </CenteredControls>

        </div>
      </ContentRow>
      <Spacer/>
      { viewState.backupScannedSuccessfully ? (<>
          <ContentBox>
            <Instruction>
              Well done.<br/>
              The backup matches the original.
            </Instruction>
          </ContentBox>
        </>) : null }
      <div style={{fontSize: "1.25rem", display: "flex", flexDirection:"row", justifyContent:"center", alignContent:"baseline",
        marginTop: "0.75rem",
        marginBottom: "0.5rem",
      }}>
      { (viewState.diceKeyComparisonResult?.errors.length ?? 0) > 5 ?
          (<div style={{display: "block"}}>The backup doesn't look anything like the original.<br/></div>) :        
        (viewState.errorDescriptor == null || viewState.errorDescriptor.cause.length === 0) ? null :
            <ErrorItemView errorDescriptor={viewState.errorDescriptor} />
        }
      </div>
      { viewState.numberOfFacesWithErrors <= 1 ? null : (
        <ErrorStepView viewState={viewState} />
      )}
      <Spacer/>
    </>)
  }
});

const ErrorItemView = ({errorDescriptor}: {errorDescriptor: FaceErrorDescriptor}) => {
  const {cause, rowName, columnName} = errorDescriptor;
  return (
    <>
      Mismatch of&nbsp;
      <i>
        <AndClause items={cause} />
      </i> &nbsp;
    at the {rowName} row, {columnName} column.
    </>
  )
}

const ErrorStepView = observer ( ({viewState}: {viewState: ValidateBackupViewState}) => {
  const {errorIndex = 0, numberOfFacesWithErrors} = viewState;
  return (
  <div className={css.ErrorStepViewBox}>
    <div className={css.MinWidthButtonContainer} style={{ ...( (errorIndex) > 0 ? {} : {visibility: "hidden"})}}>
      <button
        className={ButtonsCSS.PushButton}
        hidden={errorIndex == 0 || errorIndex == null}
        onClick={() => viewState.setErrorIndex((errorIndex ?? 1) - 1)}
        >previous
      </button>
    </div>
    <div className={css.ErrorExplanation}>
      Error {errorIndex + 1} of {numberOfFacesWithErrors}
    </div>
    <div className={css.MinWidthButtonContainer} style={{...( (errorIndex) < numberOfFacesWithErrors-1 ? {} : {visibility: "hidden"})}}>
      <button
        className={ButtonsCSS.PushButton}
        hidden={errorIndex >= numberOfFacesWithErrors - 1 }
        onClick={() => viewState.setErrorIndex((errorIndex ?? 0) + 1)}
      >next
      </button>
    </div>
  </div>

)});