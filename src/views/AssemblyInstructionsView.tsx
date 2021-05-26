import css from "./AssemblyInstructionsView.module.css";
import stepCSS from "./Navigation/StepFooterView.module.css";
import layoutCSS from "../css/Layout.module.css";

import { DiceKey } from "../dicekeys/DiceKey";
import { action, makeAutoObservable, runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { SimpleTopNavBar } from "./Navigation/SimpleTopNavBar";
import { StepFooterView } from "./Navigation/StepFooterView";
import IllustrationOfShakingBag from /*url:*/"../images/Illustration of shaking bag.svg";
import BoxBottomAfterRoll from /*url:*/"../images/Box Bottom After Roll.svg";
import BoxBottomAllDiceInPlace from /*url:*/"../images/Box Bottom All DIce In Place.svg";
import ScanDiceKeyImage from /*url:*/"../images/Scanning a DiceKey.svg";
import SealBox from /*url:*/"../images/Seal Box.svg";
import { DiceKeyViewAutoSized } from "./SVG/DiceKeyView";
import { ScanDiceKeyView } from "./LoadingDiceKeys/ScanDiceKeyView";
import { Spacer, ResizableImage, Instruction } from "./basics/";
import { BackupContentView, BackupState, BackupStepFooterView } from "./BackupView";
import { addPreview } from "./basics/Previews";

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

const Center = ({children}: React.PropsWithChildren<{}>) => (
  <div style={{display: "flex", flexDirection: "row", justifyContent:"center"}}>
    {children}
  </div>
)


export class AssemblyInstructionsState {
  diceKey?: DiceKey;
  setDiceKey = action ( (diceKey?: DiceKey) => {
    this.diceKey = diceKey;
  })
  backupState = new BackupState(this);
  step: Step;
  setStep = action ( (step?: Step) => { if (step != null) { this.step = step } } );
  get goToNextStep() { const {stepPlus1} = this; return stepPlus1 == null ? undefined : () => this.setStep(stepPlus1) };
  get goToPrevStep() { const {stepMinus1} = this; return stepMinus1 == null ? undefined : () => this.setStep(stepMinus1) };
  get stepPlus1() { 
    if (this.step === Step.ScanFirstTime && this.diceKey == undefined) {
      return this.userChoseToSkipScanningStep ? Step.SealBox : undefined;
    }
    return validStepOrUndefined(this.step+1)
  }
  get stepMinus1() {
    if (this.step === Step.SealBox && this.diceKey == undefined) {
      return Step.ScanFirstTime
    }
    return validStepOrUndefined(this.step-1)
  }
  userChoseToSkipScanningStep: boolean = false;
  setUserChoseToSkipScanningStep = action ( () => this.userChoseToSkipScanningStep = true );

  constructor(step: Step = Step.START_INCLUSIVE) {
    this.step = step;
    makeAutoObservable(this);
  }
}

const StepRandomizeView = () => (
  <>
    <Instruction>Shake the dice in the felt bag or in your hands.</Instruction>
    <Spacer/>
    <Center>
      <ResizableImage src={IllustrationOfShakingBag} alt="A bag of dice being shaken"/>
    </Center>
  </>
);

const StepDropDiceView = () => (
  <>
  <Instruction>Let the dice fall randomly.</Instruction>
  <Spacer/>
  <Center>
    <ResizableImage src={BoxBottomAfterRoll} alt="The box bottom with dice randomly placed into it."/>
  </Center>
  <Spacer/>
  <Instruction>Most should land squarely into the 25 slots in the box base.</Instruction>
  </>
);

const StepFillEmptySlots = () => (
  <>
    <Instruction>Put the remaining dice squarely into the empty slots.</Instruction>
    <Spacer/>
    <Center>
      <ResizableImage src={BoxBottomAllDiceInPlace} alt="Box bottom with all dice in place." />
    </Center>
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
    state.setDiceKey(diceKey);
    stopScanning();
  }
  const {diceKey: diceKeyScanned} = state;
  return (<>
    <Spacer/>
    <Instruction>Scan the dice in the bottom of the box (without sealing the box top into place.)</Instruction>
    <Spacer/>
    { scanning ? (<>
      <ScanDiceKeyView onDiceKeyRead={ onDiceKeyRead } />
      <button onClick={stopScanning}>Cancel</button>
    </>) : diceKeyScanned != null ? (<>
        <Center>
          <DiceKeyViewAutoSized maxHeight="50vh" maxWidth="70vw" faces={diceKeyScanned.faces} />
        </Center>
        <Spacer/>
        <button onClick={startScanning} >Scan again</button>
      </>) : (<>
        <Center>
          <ResizableImage src={ScanDiceKeyImage} alt="Illustration of scanning a DiceKey with a device camera."/>
        </Center>
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
    <Center>
      <ResizableImage src={SealBox} alt={"Sealing the box closed"}/>
    </Center>
    <Spacer/>
    <Instruction>Press firmly down along the edges. The box will snap together, helping to prevent accidental re-opening.</Instruction>
  </>
);

const StepInstructionsDone = observer (({state}: {state: AssemblyInstructionsState}) => {
  const createdDiceKey = state.diceKey != null;
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
            <Instruction>When you press the "Done" button, we'll take you to the same screen you'll see after scanning your DiceKey from the home screen.</Instruction>
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
    case Step.ScanFirstTime: return (<StepScanFirstTime {...props}/>);
    case Step.CreateBackup: return (<BackupContentView state={props.state.backupState} /> )
    case Step.SealBox: return (<StepSealBox/>);
    case Step.Done: return (<StepInstructionsDone {...props} />)
    default: return (<></>);
  }

});

interface AssemblyInstructionsViewProps {
  state: AssemblyInstructionsState;
  onComplete: (diceKeyLoaded?: DiceKey) => any;
}

const AssemblyInstructionsStepFooterView = observer ( ({state}: {state: AssemblyInstructionsState}) => (
  <StepFooterView               
    aboveFooter={(state.step === Step.ScanFirstTime && !state.userChoseToSkipScanningStep && state.diceKey == null) ? (
        <button className={stepCSS.StepButton} hidden={state.userChoseToSkipScanningStep == null}
          onClick={ ()=> runInAction( () => state.userChoseToSkipScanningStep = true) } >Let me skip scanning and backup up my DiceKey
        </button>
      ) : undefined
    }
    prev={state.goToPrevStep}
    next={state.goToNextStep}
  />
));

/* fixme 
 : (state.step === Step.CreateBackup && !state.userChoseToAllowSkippingBackupStep) ? (
      <button className={stepCSS.StepButton} hidden={state.userChoseToAllowSkippingBackupStep == null}
        onClick={ ()=> runInAction( () => state.userChoseToAllowSkippingBackupStep = true) } >Let me skip scanning and backup up my DiceKey
      </button>
    )
*/
export const AssemblyInstructionsView = observer ( (props: AssemblyInstructionsViewProps) => {
  const {state, onComplete} = props;
  return (
    <div className={layoutCSS.HeaderFooterContentBox}>
      <SimpleTopNavBar title={"Assembly Instructions"} goBack={ () => onComplete() } />
      <div className={[layoutCSS.PaddedContentBox, layoutCSS.HeaderFooterContentBox].join(" ")}>
        {/* Header, empty for spacing purposes only */}
        <div></div>
        {/* Content */}
        <AssemblyInstructionsStepSwitchView state={state} />
        {/* Footer */
          state.step === Step.CreateBackup ? (
            <BackupStepFooterView state={state.backupState} nextStepAfterEnd={props.state.goToNextStep} prevStepBeforeStart={props.state.goToPrevStep} />
          ) : (
            <AssemblyInstructionsStepFooterView state={state}  />
          )
        }
      </div>
      {/* Show the warning about not sealing the box until we have reached the box-sealing step. */}
      <div className={css.WarningFooter} hidden={state.step >= Step.SealBox}>
        Do not close the box before the final step</div>
      </div>
  )
});

addPreview("AssemblyInstructions", () => ( 
  <AssemblyInstructionsView state={new AssemblyInstructionsState(Step.ScanFirstTime)} onComplete={ () => {} } />
));

