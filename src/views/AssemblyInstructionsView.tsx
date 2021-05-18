import { DiceKey } from "../dicekeys/DiceKey";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { SimpleTopNavBar } from "./Navigation/SimpleTopNavBar";
import { StepFooterView } from "./Navigation/StepFooterView";
import Layout from "../css/Layout.module.css";

import IllustrationOfShakingBag from /*url:*/"../images/Illustration of shaking bag.svg";
import BoxBottomAfterRoll from /*url:*/"../images/Box Bottom After Roll.svg";
import BoxBottomAllDiceInPlace from /*url:*/"../images/Box Bottom All DIce In Place.svg";
import ScanDiceKeyImage from /*url:*/"../images/Scanning a DiceKey.svg";
import SealBox from /*url:*/"../images/Seal Box.svg";
import { DiceKeyView } from "./SVG/DiceKeyView";
import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";
import { Spacer, ResizableImage, Instruction } from "./basics/";

enum Step {
  Randomize = 1,
  DropDice,
  FillEmptySlots,
  ScanFirstTime,
  CreateBackup,
  SealBox,
  Done,
  END_EXCLUSIVE,
  START_INCLUSIVE = 1,
}

const validStepOrUndefined = (step: number): Step | undefined =>
  (step >= Step.START_INCLUSIVE && step < Step.END_EXCLUSIVE) ? step : undefined;


export class AssemblyInstructionsState {
  diceKeyScanned?: DiceKey;
  setDiceKeyScanned = action ( (diceKey?: DiceKey) => {
    this.diceKeyScanned = diceKey;
  })
  backupScanned?: DiceKey;
  step: Step;
  setStep = action ( (step: Step) => this.step = step );
  get stepPlus1() { return validStepOrUndefined(this.step+1) }
  get stepMinus1() { return validStepOrUndefined(this.step-1) }
  userChoseToAllowSkipScanningStep: boolean = false;
  userChoseToAllowSkippingBackupStep: boolean = false;

  constructor(step: Step = Step.START_INCLUSIVE) {
    this.step = step;
    makeAutoObservable(this);
  }
}

const StepRandomizeView = () => (
  <>
    <Instruction>Shake the dice in the felt bag or in your hands.</Instruction>
    <Spacer/>
    <ResizableImage src={IllustrationOfShakingBag} alt="A bag of dice being shaken"/>
  </>
);

const StepDropDiceView = () => (
  <>
  <Instruction>Let the dice fall randomly.</Instruction>
  <Spacer/>
  <ResizableImage src={BoxBottomAfterRoll} alt="The box bottom with dice randomly placed into it."/>
  <Spacer/>
  <Instruction>Most should land squarely into the 25 slots in the box base.</Instruction>
  </>
);

const StepFillEmptySlots = () => (
  <>
    <Instruction>Put the remaining dice squarely into the empty slots.</Instruction>
    <Spacer/>
    <ResizableImage src={BoxBottomAllDiceInPlace} alt="Box bottom with all dice in place." />
    <Spacer/>
    <Instruction>Leave the rest in their original random order and orientations.</Instruction>
    <Spacer/>
  </>
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
    state.setDiceKeyScanned(diceKey);
    stopScanning();
  }
  const {diceKeyScanned} = state;
  return (<>
    <Spacer/>
    <Instruction>Scan the dice in the bottom of the box (without the top.)</Instruction>
    <Spacer/>
    { scanning ? (<>
      <ScanDiceKeyView onDiceKeyRead={ onDiceKeyRead } />
      <button onClick={stopScanning}>Cancel</button>
    </>) : diceKeyScanned != null ? (<>
        <DiceKeyView faces={diceKeyScanned.faces} />
        <Spacer/>
        <button onClick={startScanning} >Scan again</button>
      </>) : (<>
        <ResizableImage src={ScanDiceKeyImage} alt="Illustration of scanning a DiceKey with a device camera."/>
        <Spacer/>
        <button onClick={startScanning}>Scan</button>
        <Spacer/>
      </>)
    }
  </>);
});

const StepSealBox = () => (
  <>
    <Instruction>Place the box top above the base so that the hinges line up.</Instruction>
    <Spacer/>
    <ResizableImage src={SealBox} alt={"Sealing the box closed"}/>
    <Spacer/>
    <Instruction>Press firmly down along the edges. The box will snap together, helping to prevent accidental re-opening.</Instruction>
  </>
);

const StepInstructionsDone = observer (({state}: {state: AssemblyInstructionsState}) => {
  const createdDiceKey = state.diceKeyScanned != null;
  const backedUpSuccessfully = false; // FIXME
  return (
    <div style={{display: "flex", flexDirection: "column", flexGrow: 1, justifyContent: "center"}}>
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
            <Instruction>When you press the \"Done\" button, we'll take you to the same screen you'll see after scanning your DiceKey from the home screen.</Instruction>
          </>)
        }
      </div>
   </div>
)});

const AssemblyInstructionsStepSwitchView = observer ( (props: {state: AssemblyInstructionsState}) => {
  switch (props.state.step) {
    case Step.Randomize: return (<StepRandomizeView/>);
    case Step.DropDice: return (<StepDropDiceView/>);
    case Step.FillEmptySlots: return (<StepFillEmptySlots/>);
    case Step.ScanFirstTime: return (<StepScanFirstTime {...props}/>)
    case Step.SealBox: return (<StepSealBox/>);
    case Step.Done: return (<StepInstructionsDone {...props} />)
    default: return (<></>);
  }

});

interface AssemblyInstructionsViewProps {
  state: AssemblyInstructionsState;
  onComplete: (diceKeyLoaded?: DiceKey) => any;
}
export const AssemblyInstructionsView = observer ( (props: AssemblyInstructionsViewProps) => {
  const {state, onComplete} = props;
  return (
    <div className={Layout.RowStretched}>
      <div className={Layout.ColumnStretched}>
        <SimpleTopNavBar title={"Assembly Instructions"} goBack={ () => onComplete() } />
        <div className={Layout.PaddedStretchedColumn}>
          <AssemblyInstructionsStepSwitchView state={state} />
          <StepFooterView setStep={state.setStep} pprev={undefined} prev={state.stepMinus1} next={state.stepPlus1} />
        </div>
      </div>
    </div>
  )
});


export const Preview_AssemblyInstructions = () => {
  return (
    <AssemblyInstructionsView state={new AssemblyInstructionsState(Step.ScanFirstTime)} onComplete={ () => {} } />
  );
};
