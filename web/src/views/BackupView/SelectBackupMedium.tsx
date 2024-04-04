import { observer } from "mobx-react";
import React from "react";
import { FaceCopyingView } from "../SVG/FaceCopyingView";
import { Instruction } from "../basics";
import { HideRevealSecretsState } from "../../state/stores/HideRevealSecretsState";
import { LabelBelowButtonImage } from "./BackupDiceKeyView";
import { DiceKey, DiceKeyWithoutKeyId, FaceLetters } from "../../dicekeys/DiceKey";
import styled from "styled-components";
import { ShareEntry } from "../SimpleSecretSharing/SubViews/RowOfShares";
import { BackupMedium, HandGeneratedBackupMedium, HandGeneratedBackupMediumDice, HandGeneratedBackupMediumStickers, MachineGeneratedBackupMediumPrintout, MetaBackupMediumShares } from "../../dicekeys/PhysicalMedium";
import { PrintWarningSymbol } from "../SimpleSecretSharing/PrintDiceKeyView";

export const FeatureCardButton = styled.button`
  align-self: center;
  display: flex;
  cursor: grab;
  font-size: 1.25rem;
  flex-direction: column;
  justify-content: stretch;
  align-items: stretch;
  align-content: center;
  padding-top: 1.5vh;
  padding-bottom: 1.5vh;
  margin-top: 1.5vh;
  margin-bottom: 1.5vh;
  border-radius: min(1vh,1vw);
  padding-left: 1vw;
  padding-right: 1vw;
  border: none;
  &:hover {
    background: rgba(128,128,128,0.2);
  }
  &:not(:first-of-type) {
    margin-top: 1vh;
  }
`;

const RowOfSharesDiv = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 2vw;
`

export const SelectBackupMediumView = observer(({ 
  diceKey, onSelected
}: {
  diceKey: DiceKey
  onSelected: (medium: BackupMedium) => void,
}) => (
  <>
    <Instruction>How do you want to backup your DiceKey?</Instruction>{([
      [HandGeneratedBackupMediumStickers, (<>Backup to a paper sheet using stickers (a SticKey kit)</>)],
      [HandGeneratedBackupMediumDice, (<>Backup to a box of dice (a DiceKey kit)</>)]
    ] as const satisfies readonly (readonly [HandGeneratedBackupMedium, JSX.Element | string])[]).map(([medium, label]) => (
      <FeatureCardButton key={medium}
        onClick={ () => { onSelected(medium) } }
      >
        <FaceCopyingView medium={medium} diceKey={diceKey} showArrow={true} indexOfLastFacePlaced={12}
          obscureAllButCenterDie={HideRevealSecretsState.shouldDiceKeyBeHidden(diceKey) === true}
          style={{width: `30vw`, maxHeight: `10vw`}}
        />
        <LabelBelowButtonImage>{label}</LabelBelowButtonImage>
      </FeatureCardButton>
    ))}{
      // Only show the option to split into shares if this is a DiceKey that has unique face letters and thus
      // can be converted to finite field format.
      !diceKey.hasUniqueFaceLetters ? null : (
      <FeatureCardButton key={"shares"}
        onClick={ () => { onSelected(MetaBackupMediumShares) } }
      >
        <RowOfSharesDiv>
        { FaceLetters.slice(0, 5).map( (letter) => (
          <ShareEntry key={letter} maxViewHeight={15} numShares={5} diceKey={DiceKeyWithoutKeyId.fromRandom(letter)} />
        ))
        }
        </RowOfSharesDiv>
        <LabelBelowButtonImage>Split into shares</LabelBelowButtonImage>
      </FeatureCardButton>
    )}
    <FeatureCardButton key={"print"}
        onClick={ () => { onSelected(MachineGeneratedBackupMediumPrintout) } }
      >
        <span style={{fontSize: `3vh`}}>🖨</span>
        <LabelBelowButtonImage>Print <PrintWarningSymbol/></LabelBelowButtonImage>
      </FeatureCardButton>
  </>
));


// export const StepSelectBackupMediumView = observer(({
//   getDiceKey 
// }: {
//   getDiceKey: () => DiceKey | undefined;
//   onSelected: 
// }) => {
//   const diceKey = getDiceKey();
//   return diceKey == null ? null : (
//     <SelectBackupMediumView
//       diceKey={diceKey}
//       onSelected={() => {}}// FIXME medium => state.setBackupMedium(medium)()}
//     />
//   );
// });
