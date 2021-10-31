import { DiceKey } from "../dicekeys/DiceKey";
import { observer } from "mobx-react";
import React from "react";
import { SimpleTopNavBar } from "./Navigation/SimpleTopNavBar";
import { StepFooterView } from "./Navigation/StepFooterView";
import IllustrationOfShakingBag from /*url:*/"../images/Illustration of shaking bag.svg";
import BoxBottomAfterRoll from /*url:*/"../images/Box Bottom After Roll.svg";
import BoxBottomAllDiceInPlace from /*url:*/"../images/Box Bottom All Dice In Place.svg";
import ScanDiceKeyImage from /*url:*/"../images/Scanning a DiceKey.svg";
import SealBox from /*url:*/"../images/Seal Box.svg";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";
import { Spacer, ResizableImage, Instruction, CenteredControls, CenterRow, PaddedContentBox } from "./basics/";
import { BackupStepFooterView, BackupStepSwitchView } from "./BackupView";
import { addPreview } from "./basics/Previews";
import {AssemblyInstructionsStep, AssemblyInstructionsState} from "./AssemblyInstructionsState";
import { DiceKeyState } from "../state/Window/DiceKeyState";
import { PushButton, StepButton } from "../css/Button";
import { ColumnVerticallyCentered } from "./basics/Layout";
import { PrimaryView } from "../css/Page";
import styled from "styled-components";
import { BelowTopNavigationBarWithNoBottomBar, TopNavigationBarHeightInVh } from "./Navigation/TopNavigationBar";


const WarningFooterDivHeight = `1.5rem`;
const WarningFooterDivVerticalPadding = `0.75rem`;
const WarningFooterTotalHeightFormula = `(${WarningFooterDivHeight} + 2 * ${WarningFooterDivVerticalPadding})`;


const AssemblyInstructionsContainer = styled(BelowTopNavigationBarWithNoBottomBar)`
  margin-left: 5vw;
  margin-right: 5vw;
  width: 90vw;
  height: calc(100vh - ${TopNavigationBarHeightInVh}vh - ${WarningFooterTotalHeightFormula});
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
  // @State var scanning: Bool = false
  // @Binding var diceKey: DiceKey?
  // #if os(iOS)
  // let scanningImageName = "Scanning Side View"
  // #else
  // let scanningImageName = "Mac Scanning Image"
  // #endif
  const [scanning, setScanning] = React.useState<boolean>(false);
  const startScanning = () => setScanning(true);
  const stopScanning = () => setScanning(false);
  const onDiceKeyRead = (diceKey: DiceKey) => {
    state.foregroundDiceKeyState.setDiceKey(diceKey);
    stopScanning();
  }
  const {diceKey} = state.foregroundDiceKeyState;
  return (<PaddedContentBox>
    <Spacer/>
    <Instruction>Scan the dice in the bottom of the box (without sealing the box top into place.)</Instruction>
    <Spacer/>
    { scanning ? (<>
      <ScanDiceKeyView onDiceKeyRead={ onDiceKeyRead }
        maxWidth="80vw"
        maxHeight="50vh"
      />
      <CenteredControls>
        <PushButton onClick={stopScanning}>Cancel</PushButton>
      </CenteredControls>
    </>) : diceKey != null ? (<>
        <CenterRow>
          <DiceKeyView size={`min(50vh,70vw)`} faces={diceKey.faces} />
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
        <Spacer/>
      </>)
    }
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
  const createdDiceKey = state.foregroundDiceKeyState.diceKey != null;
  const backedUpSuccessfully = state.backupState.validationStepViewState.backupScannedSuccessfully;
  return (
    <ColumnVerticallyCentered>
        <div style={{display: "block"}}>
          <Instruction>{createdDiceKey ? "You did it!" : "That's it!"}</Instruction>
          <Spacer/>
          { createdDiceKey ? (<></>) : (<>
              <Instruction>There's nothing more to it.</Instruction>
              <Instruction>Go back to assemble and scan in a real DiceKey.</Instruction>
            </>)
          }{ backedUpSuccessfully ? (<></>) :(<>
              <Instruction>Be sure to make a backup soon!</Instruction>
            </>)
          }{ !createdDiceKey ? (<></>) : (<>
              <Instruction>When you press the "Done" button, we'll take you to the same screen you'll see after scanning your DiceKey from the home screen.</Instruction>
            </>)
          }
        </div>
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
  onComplete: (diceKeyLoaded?: DiceKey) => any;
}

const AssemblyInstructionsStepFooterView = observer ( ({state, onComplete}:  AssemblyInstructionsViewProps) => (
  <StepFooterView               
    aboveFooter={(state.step === AssemblyInstructionsStep.ScanFirstTime && !state.userChoseToSkipScanningStep && state.foregroundDiceKeyState.diceKey == null) ? (
        <StepButton invisible={state.userChoseToSkipScanningStep == null}
          onClick={ state.setUserChoseToSkipScanningStep }
          style={{marginBottom: "0.5rem"}}
        >Let me skip scanning and backing up my DiceKey
        </StepButton>
      ) : undefined
    }
    nextIsDone={state.step === (AssemblyInstructionsStep.END_EXCLUSIVE - 1)}
    prev={state.goToPrevStep}
    next={state.step === (AssemblyInstructionsStep.END_EXCLUSIVE-1) ? onComplete : state.goToNextStep}
  />
));


export const AssemblyInstructionsView = observer ( (props: AssemblyInstructionsViewProps) => {
  const {state, onComplete} = props;
  return (
    <PrimaryView>
      <SimpleTopNavBar title={"Assembly Instructions"} goBack={ onComplete } />
      <AssemblyInstructionsContainer>{
          state.step === AssemblyInstructionsStep.CreateBackup ? (
            // Specialized content for backups.
            <>
              <BackupStepSwitchView state={props.state.backupState} />
              <Spacer/>
              <BackupStepFooterView state={state.backupState}
                /* when final backup step is done we'll go to the next step of assembly */
                nextStepAfterEnd={props.state.goToNextStep}
                /* If stepping back from the first step of backup, move to the previous assembly step */
                prevStepBeforeStart={props.state.goToPrevStep}
              />
            </>
          ) : (
            <>
              {/* Header, empty for spacing purposes only */}
              <Spacer/>
              {/* Content */}
              <AssemblyInstructionsStepSwitchView state={state} />
              <Spacer/>
              {/* Show the step footer for all steps other than the sub-steps of the Backup process */}
              <AssemblyInstructionsStepFooterView {...props}  />
            </>
          )
        }
        {/* Show the warning about not sealing the box until we have reached the box-sealing step. */}
      </AssemblyInstructionsContainer>
    <WarningFooterDiv invisible={state.step >= AssemblyInstructionsStep.SealBox } >
      Do not close the box before the final step.
    </WarningFooterDiv>
    </PrimaryView>
  )
});

addPreview("AssemblyInstructions", () => ( 
  <AssemblyInstructionsView state={new AssemblyInstructionsState(new DiceKeyState(DiceKey.testExample), AssemblyInstructionsStep.ScanFirstTime)} onComplete={ () => {alert("Called goBack()")} } />
));

