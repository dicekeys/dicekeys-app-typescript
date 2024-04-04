import React from "react";
import { DiceKeyWithoutKeyId, PartialDiceKey } from "../../dicekeys/DiceKey";
import { observer } from "mobx-react";
import { ScanDiceKeyView } from "../LoadingDiceKeys/ScanDiceKeyView";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { AndClause, CenteredControls, ContentBox, ContentRow, CenterColumn, Instruction, Spacer } from "../basics";
import { ValidateBackupViewState, FaceErrorDescriptor } from "./ValidateBackupViewState";
import { visibility } from "../../utilities/visibility";
import { PushButton } from "../../css/Button";
import styled from "styled-components";
import { ComparisonBox } from ".";

const ErrorStepViewBox = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: baseline;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  flex-shrink: 0.1;
  flex-grow: 0.1;
`;

const ErrorExplanation = styled.div`
  min-width: 20vw;
  font-size: 1.1rem;
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-content: baseline
`;

const MinWidthButtonContainer = styled.div<{invisible?: boolean}>`
  min-width: 10vw;
  visibility: ${props=>props.invisible ? "hidden" : "visible"}
`;

export const ValidateBackupView = observer ( ({
  viewState
}: {
  viewState: ValidateBackupViewState
}) => {
  const {originalDiceKey, diceKeyScanned} = viewState;
  const onDiceKeyRead = (diceKey?: DiceKeyWithoutKeyId) => {
    if (diceKey != null && viewState.scanning === "backup") {
      viewState.setDiceKeyScannedForValidation(diceKey);
    } else if (diceKey != null && viewState.scanning === "original" && "setDiceKey" in viewState && viewState.setDiceKey != null) {
      viewState.setDiceKey(diceKey);
    }
    viewState.stopScanning();
  };
  if (viewState.scanning) {
    return (<><Spacer/><CenterColumn>
      <ScanDiceKeyView
        height="55vh"
        onDiceKeyRead={ onDiceKeyRead }
      />
      <CenteredControls>
          <PushButton onClick={viewState.stopScanning} >Stop scanning</PushButton>
      </CenteredControls>
    </CenterColumn></>)
  } else if (originalDiceKey != null) {
    return (<>
      <ContentRow>
        <ComparisonBox>
          <DiceKeyView
            diceKey={originalDiceKey}
            neverRotate={true}
            $size={`min(25vw,40vh)`}
            highlightFaceAtIndex={viewState.errorDescriptor?.faceIndex}
            />
          <CenteredControls>
            <PushButton $invisible={viewState.setDiceKey == null} onClick={viewState.startScanningOriginal}>Re-scan your original DiceKey</PushButton>
          </CenteredControls>
        </ComparisonBox>
        <ComparisonBox>
          {diceKeyScanned == null ? (
            <DiceKeyView
              $size={`min(25vw,40vh)`}
              onFaceClicked={viewState.startScanningBackup}
              obscureAllButCenterDie={false}
            />
          ) : (
            <DiceKeyView
              $size={`min(25vw,40vh)`}
              faces={diceKeyScanned?.faces ?? [] as unknown as PartialDiceKey }
              highlightFaceAtIndex={viewState.errorDescriptor?.faceIndex}
            />
          )
          }
          <CenteredControls>
            <PushButton  onClick={viewState.startScanningBackup} >{
              viewState.diceKeyScannedForValidation == null ? (<>Scan backup to verify</>) : (<>Re-scan Backup</>)
            }</PushButton>  
          </CenteredControls>

        </ComparisonBox>
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
  return null;
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
  <ErrorStepViewBox>
    <MinWidthButtonContainer style={{ ...( (errorIndex) > 0 ? {} : {visibility: "hidden"})}}>
      <PushButton
        $invisible={errorIndex == 0 || errorIndex == null}
        onClick={() => viewState.setErrorIndex((errorIndex ?? 1) - 1)}
        >previous
      </PushButton>
    </MinWidthButtonContainer>
    <ErrorExplanation>
      Error {errorIndex + 1} of {numberOfFacesWithErrors}
    </ErrorExplanation>
    <MinWidthButtonContainer style={visibility(errorIndex < numberOfFacesWithErrors-1)}>
      <PushButton
        $invisible={errorIndex >= numberOfFacesWithErrors - 1 }
        onClick={() => viewState.setErrorIndex((errorIndex ?? 0) + 1)}
      >next
      </PushButton>
    </MinWidthButtonContainer>
  </ErrorStepViewBox>

)});