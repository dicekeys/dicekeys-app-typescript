import css from "./AssemblyInstructionsView.module.css";
import stepCSS from "./Navigation/StepFooterView.module.css";
import layoutCSS from "../css/Layout.module.css";

import { DiceKey } from "../dicekeys/DiceKey";
import { runInAction } from "mobx";
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
import { BackupContentView, BackupStepFooterView } from "./BackupView";
import { addPreview } from "./basics/Previews";
import {AssemblyInstructionsStep, AssemblyInstructionsState} from "./AssemblyInstructionsState";

const Center = ({children}: React.PropsWithChildren<{}>) => (
  <div style={{display: "flex", flexDirection: "row", justifyContent:"center"}}>
    {children}
  </div>
)

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
  const backedUpSuccessfully = state.backupState.validateBackupState.backupScannedSuccessfully;
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
    case AssemblyInstructionsStep.Randomize: return (<StepRandomizeView/>);
    case AssemblyInstructionsStep.DropDice: return (<StepDropDiceView/>);
    case AssemblyInstructionsStep.FillEmptySlots: return (<StepFillEmptySlots/>);
    case AssemblyInstructionsStep.ScanFirstTime: return (<StepScanFirstTime {...props}/>);
    case AssemblyInstructionsStep.CreateBackup: return (<BackupContentView state={props.state.backupState} /> )
    case AssemblyInstructionsStep.SealBox: return (<StepSealBox/>);
    case AssemblyInstructionsStep.Done: return (<StepInstructionsDone {...props} />)
    default: return (<></>);
  }

});

interface AssemblyInstructionsViewProps {
  state: AssemblyInstructionsState;
  onComplete: (diceKeyLoaded?: DiceKey) => any;
}

const AssemblyInstructionsStepFooterView = observer ( ({state}: {state: AssemblyInstructionsState}) => (
  <StepFooterView               
    aboveFooter={(state.step === AssemblyInstructionsStep.ScanFirstTime && !state.userChoseToSkipScanningStep && state.diceKey == null) ? (
        <button className={stepCSS.StepButton} hidden={state.userChoseToSkipScanningStep == null}
          onClick={ ()=> runInAction( () => state.userChoseToSkipScanningStep = true) } >Let me skip scanning and backup up my DiceKey
        </button>
      ) : undefined
    }
    nextIsDone={state.step === (AssemblyInstructionsStep.END_EXCLUSIVE - 1)}
    prev={state.goToPrevStep}
    next={state.goToNextStep}
  />
));

export const AssemblyInstructionsView = observer ( (props: AssemblyInstructionsViewProps) => {
  const {state, onComplete} = props;
  return (
    <div className={layoutCSS.HeaderFooterContentBox}>
      <SimpleTopNavBar title={"Assembly Instructions"} goBack={ () => onComplete() } />
      <div className={[layoutCSS.PaddedContentBox, layoutCSS.HeaderFooterContentBox].join(" ")}>
        {/* Header, empty for spacing purposes only */}
        <div></div>
        {/* Content */}
        <div className={layoutCSS.PaddedContentBox}>
          <AssemblyInstructionsStepSwitchView state={state} />
        </div>
        {/* Footer */
          state.step === AssemblyInstructionsStep.CreateBackup ? (
            <BackupStepFooterView state={state.backupState} nextStepAfterEnd={props.state.goToNextStep} prevStepBeforeStart={props.state.goToPrevStep} />
          ) : (
            <AssemblyInstructionsStepFooterView state={state}  />
          )
        }
      </div>
      {/* Show the warning about not sealing the box until we have reached the box-sealing step. */}
      <div className={css.WarningFooter} hidden={state.step >= AssemblyInstructionsStep.SealBox}>
        Do not close the box before the final step</div>
      </div>
  )
});

addPreview("AssemblyInstructions", () => ( 
  <AssemblyInstructionsView state={new AssemblyInstructionsState(() => {}, AssemblyInstructionsStep.ScanFirstTime)} onComplete={ () => {} } />
));

