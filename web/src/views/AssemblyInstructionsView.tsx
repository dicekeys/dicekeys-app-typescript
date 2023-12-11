import { DiceKey, DiceKeyWithoutKeyId } from "../dicekeys/DiceKey";
import { observer } from "mobx-react";
import React from "react";
import { SimpleTopNavBar } from "./Navigation/SimpleTopNavBar";
import { StepFooterView } from "./Navigation/StepFooterView";
import IllustrationOfShakingBag from "../images/Illustration of shaking bag.svg";
import BoxBottomAfterRoll from "../images/Box Bottom After Roll.svg";
import BoxBottomAllDiceInPlace from "../images/Box Bottom All Dice In Place.svg";
import ScanDiceKeyImage from "../images/Scanning a DiceKey.svg";
import SealBox from "../images/Seal Box.svg";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";
import { Spacer, ResizableImage, Instruction, CenteredControls, CenterRow, PaddedContentBox } from "./basics/";
import { BackupDiceKeyView } from "./BackupView";
import { addPreview } from "./basics/Previews";
import { AssemblyInstructionsStep, AssemblyInstructionsState } from "./AssemblyInstructionsState";
import { PushButton, StepButton } from "../css/Button";
import { CenterColumn, ColumnVerticallyCentered } from "./basics/Layout";
import styled from "styled-components";
import { WindowRegionBelowTopNavigationBarWithSideMargins, calcHeightBelowTopNavigationBar } from "./Navigation/NavigationLayout";
import { cssCalcTyped, cssExprWithoutCalc } from "../utilities";
import { NavigationPathState } from "../state/core/NavigationPathState";
import { addressBarState } from "../state/core/AddressBarState";
import { DiceKeyWithoutIdState } from "./WithSelectedDiceKey/DiceKeyWithoutIdState";


const WarningFooterDivHeight = `1.5rem`;
const WarningFooterDivVerticalPadding = `0.75rem`;
const WarningFooterTotalHeightFormula = cssCalcTyped(`${WarningFooterDivHeight} + 2px * ${WarningFooterDivVerticalPadding}`);


const AssemblyInstructionsContainer = styled(WindowRegionBelowTopNavigationBarWithSideMargins)`
  height: ${cssCalcTyped(`${cssExprWithoutCalc(calcHeightBelowTopNavigationBar)} - ${cssExprWithoutCalc(WarningFooterTotalHeightFormula)}`)};
`

const WarningFooterDiv = styled.div<{invisible?: boolean}>`
  visibility: ${props => props.invisible ? "hidden" : "visible"};
  height: ${WarningFooterDivHeight};
  justify-self: flex-end;
  background-color: red;
  color: white;
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  align-content: baseline;
  padding-top: ${WarningFooterDivVerticalPadding};
  padding-bottom: ${WarningFooterDivVerticalPadding};
  font-size: 1.5rem;
  text-transform: uppercase;
  user-select: none;
`;



const StepRandomizeView = () => (
  <PaddedContentBox>
    <Instruction>Shake the dice in the felt bag or in your hands.</Instruction>
    <Spacer/>
    <ResizableImage src={IllustrationOfShakingBag} alt="A bag of dice being shaken"/>
  </PaddedContentBox>
);

const StepDropDiceView = () => (
  <PaddedContentBox>
  <Instruction>Let the dice fall randomly.</Instruction>
  <Spacer/>
  <ResizableImage src={BoxBottomAfterRoll} alt="The box bottom with dice randomly placed into it."/>
  <Spacer/>
  <Instruction>Most should land squarely into the 25 slots in the box base.</Instruction>
  </PaddedContentBox>
);

const StepFillEmptySlots = () => (
  <PaddedContentBox>
    <Instruction>Put the remaining dice squarely into the empty slots.</Instruction>
    <Spacer/>
    <ResizableImage src={BoxBottomAllDiceInPlace} alt="Box bottom with all dice in place." />
    <Spacer/>
    <Instruction>Leave the rest in their original random order and orientations.</Instruction>
    <Spacer/>
  </PaddedContentBox>
);

const StepScanFirstTime = observer ( ({state}: {state: AssemblyInstructionsState}) => {
  const [scanning, setScanning] = React.useState<boolean>(false);
  const startScanning = () => setScanning(true);
  const stopScanning = () => setScanning(false);
  const onDiceKeyRead = (diceKey?: DiceKeyWithoutKeyId) => {
    state.getSetDiceKey.setDiceKey(diceKey);
    stopScanning();
  }
  const {diceKey} = state;
  return (<PaddedContentBox>
    <Spacer/>
    <Instruction>Scan the dice in the bottom of the box (without sealing the box top into place.)</Instruction>
    { scanning ? 
      // Scanning action
      (
        <CenterColumn>
          <ScanDiceKeyView onDiceKeyRead={ onDiceKeyRead } height={`45vh`} />
          <CenteredControls>
            <PushButton onClick={stopScanning}>Cancel</PushButton>
          </CenteredControls>
        </CenterColumn>
      ) : diceKey != null ? (<>
        <CenterRow>
          <DiceKeyView $size={`min(50vh,70vw)`} diceKey={diceKey} obscureAllButCenterDie={false} />
        </CenterRow>
        <CenteredControls>
          <PushButton onClick={startScanning} >Scan again</PushButton>
        </CenteredControls>
      </>) : (<>
        <ResizableImage src={ScanDiceKeyImage} alt="Illustration of scanning a DiceKey with a device camera."/>
        <Spacer/>
        <CenteredControls>
          <PushButton onClick={startScanning}>Scan</PushButton>
        </CenteredControls>
      </>)
    }
    <Spacer/>
  </PaddedContentBox>);
});

const StepSealBox = () => (
  <PaddedContentBox>
    <Instruction>Place the box top above the base so that the hinges line up.</Instruction>
    <Spacer/>
    <ResizableImage src={SealBox} alt={"Sealing the box closed"}/>
    <Spacer/>
    <Instruction>Press firmly down along the edges. The box will snap together, helping to prevent accidental re-opening.</Instruction>
  </PaddedContentBox>
);

const StepInstructionsDone = observer (({state}: {state: AssemblyInstructionsState}) => {
  const {diceKey, backedUpSuccessfully} = state;
  return (
    <ColumnVerticallyCentered>
      <div style={{display: "block"}}>{
        diceKey != null ? (<>
          <Instruction>You did it!</Instruction>
          <Spacer/>
          <CenterColumn>
            <DiceKeyView $size={`min(50vh,70vw)`} diceKey={diceKey} />
          </CenterColumn>
          <Spacer/>
          { backedUpSuccessfully ? null : (
            <Instruction>Be sure to make a backup soon!</Instruction>
          )}
          <Instruction>When you press the <i>done</i> button, we'll take you to the same screen you will see after scanning your DiceKey from the home screen.</Instruction>
        </>) : (<>
          <Instruction>That's it! There's nothing more to it.</Instruction>
          <Instruction>Go back to assemble and scan in a real DiceKey.</Instruction>
        </>)
      }</div>
    </ColumnVerticallyCentered>
)});

const AssemblyInstructionsStepSwitchView = observer ( (props: {state: AssemblyInstructionsState}) => {
  switch (props.state.step) {
    case AssemblyInstructionsStep.Randomize: return (<StepRandomizeView/>);
    case AssemblyInstructionsStep.DropDice: return (<StepDropDiceView/>);
    case AssemblyInstructionsStep.FillEmptySlots: return (<StepFillEmptySlots/>);
    case AssemblyInstructionsStep.ScanFirstTime: return (<StepScanFirstTime {...props}/>);
    case AssemblyInstructionsStep.SealBox: return (<StepSealBox/>);
    case AssemblyInstructionsStep.Done: return (<StepInstructionsDone {...props} />);
    case AssemblyInstructionsStep.CreateBackup: throw "Backups should not reach this switch";
    default: return (<></>);
  }

});

interface AssemblyInstructionsViewProps {
  state: AssemblyInstructionsState;
  onComplete: (diceKey?: DiceKey) => void;
}

const AssemblyInstructionsStepFooterView = observer ( ({state, onComplete}:  AssemblyInstructionsViewProps) => {
  return (
    <StepFooterView               
    nextIsDone={state.step === (AssemblyInstructionsStep.END_EXCLUSIVE - 1)}
    prev={state.goToPrevStep}
    next={state.step < (AssemblyInstructionsStep.END_EXCLUSIVE-1) ? state.goToNextStep : () => onComplete(state.getSetDiceKey.getDiceKey()) }
  >{
    (state.step === AssemblyInstructionsStep.ScanFirstTime && !state.userChoseToSkipScanningStep && state.diceKey == null) ? (
      <StepButton $invisible={state.userChoseToSkipScanningStep == null}
        onClick={ state.setUserChoseToSkipScanningStep }
        style={{marginBottom: "0.5rem"}}
      >Let me skip scanning and backing up my DiceKey
      </StepButton>
    ) : (state.step === AssemblyInstructionsStep.CreateBackup && state.backupState.subView == null && !state.userChoseToSkipScanningStep) ? (
      <StepButton $invisible={state.userChoseToSkipScanningStep == null}
        onClick={ state.setUserChoseToSkipBackupStep }
        style={{marginBottom: "0.5rem"}}
      >Let me skip backing up my DiceKey
      </StepButton>
    ) : undefined 
  }</StepFooterView>
    )
});


export const AssemblyInstructionsView = observer ( (props: AssemblyInstructionsViewProps) => {
  const {state} = props;
  return (
    <>
      <SimpleTopNavBar title={"Assembly Instructions"} goBack={ addressBarState.back } />
      <AssemblyInstructionsContainer>{
          state.step === AssemblyInstructionsStep.CreateBackup && (state.backupState != null) ? (
            // Specialized content for backups.
            <BackupDiceKeyView state={state.backupState} 
              /* when final backup step is done we'll go to the next step of assembly */
              onBackFromStart={state.goToPrevStep}
              onComplete={(status) => {
                state.setBackupStatus(status);
                state.goToNextStep?.();
              }}
            />
          ) : (
            <>
              <AssemblyInstructionsStepSwitchView state={state} />
              <AssemblyInstructionsStepFooterView {...props}  />
            </>
          )
        }
        {/* Show the warning about not sealing the box until we have reached the box-sealing step. */}
      </AssemblyInstructionsContainer>
    <WarningFooterDiv invisible={state.step >= AssemblyInstructionsStep.SealBox } >
      Do not close the box before the final step.
    </WarningFooterDiv>
    </>
  )
});

addPreview("AssemblyInstructions", () => ( 
  <AssemblyInstructionsView state={new AssemblyInstructionsState(NavigationPathState.root, () => {}, {step: AssemblyInstructionsStep.ScanFirstTime, ...new DiceKeyWithoutIdState().getSetDiceKey})} onComplete={ () => {alert("Called goBack()")} } />
));

