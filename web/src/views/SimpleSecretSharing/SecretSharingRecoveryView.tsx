import { observer } from "mobx-react";
import React from "react";
import { DiceKeyWithoutKeyId, FaceLetter, FaceLetters } from "../../dicekeys/DiceKey";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { rangeFromTo } from "../../utilities/range";
import { LoadDiceKeyContentPaneView } from "../LoadingDiceKeys/LoadDiceKeyView";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { addPreview } from "../basics/Previews";
import { BottomInstructionRow, ChoiceSelect, ChoiceText, RowViewHeightDiceKey, SecretSharingViewContainer, TopInstructionRow } from "./layout";
import { ShareEntry, RowOfSharesDiv } from "./SubViews/RowOfShares";
import { SecretSharingRecoveryState } from "./SecretSharingRecoveryState";
import { ButtonRow, PushButton } from "../../css/Button";

export interface SecretSharingRecoveryProps {
	state: SecretSharingRecoveryState;
}

const DiceKeyRecoveredRowView = observer(({
	state,
}: {
	state: SecretSharingRecoveryState;
}) => (<DiceKeyView  
					$size={`min(80vw,${RowViewHeightDiceKey}vh)`}
					diceKey={state.derivedDiceKey}
			/>));

const SharesScannedView = observer( ({state}: {state: SecretSharingRecoveryState}) => (
	state.userScannedSharesAsDiceKeys.map((diceKey) => (
		<ShareEntry key={diceKey.centerFace.letter}
			numShares={state.minSharesToDecode}
			diceKey={diceKey}
	><PushButton onClick={() => state.removeUserScannedShare(diceKey.centerFace.letter)}>remove</PushButton>{	
	}</ShareEntry>
))));

const SharesScannedRowView = observer( ({state}: {state: SecretSharingRecoveryState}) => (
	<RowOfSharesDiv $numShares={Math.max(state.minSharesToDecode, state.userScannedSharesAsDiceKeys.length)}>
		<SharesScannedView {...{state}} />
	</RowOfSharesDiv>
));

export const SecretSharingRecoveryView = observer(({onComplete, state}: SecretSharingRecoveryProps & {
	onComplete: (diceKey?: DiceKeyWithoutKeyId | undefined) => void;
}) => {
	if (state.loadDiceKeyViewState != null) {
		return (
			<LoadDiceKeyContentPaneView
				instruction={state.secretCenterLetter == null ? undefined :
					`The center die of the scanned DiceKey cannot have the letter ${state.secretCenterLetter}.` }
				state={state.loadDiceKeyViewState}
				onDiceKeyReadOrCancelled={state.onLoadDicekeyCompletedOrCancelled}
			/>
		);
	}
	return (
		<SecretSharingViewContainer>
			<TopInstructionRow>
			<ChoiceText>
					Recover secret with center letter&nbsp;<ChoiceSelect
					value={state.secretCenterLetter}
					onChange={ e => state.setSecretCenterLetter(e.currentTarget.value.length != 1 ? undefined : e.currentTarget.value as FaceLetter) }
				><option key="" value={undefined}></option>{
					FaceLetters.map( i => (
						<option key={i} value={i}>{i}</option>
					))
				}</ChoiceSelect>&nbsp;from&nbsp;<ChoiceSelect
							value={state.minSharesToDecode}
							onChange={ e => state.setMinSharesToDecode(parseInt(e.currentTarget.value)) }>{
							rangeFromTo(1, 24).map( i => (
								<option key={i} value={i}>{i}</option>
							))
					}</ChoiceSelect>&nbsp;shares.
				</ChoiceText>
			</TopInstructionRow>
			<SharesScannedRowView {...{state}} />
			<ButtonRow>
					<PushButton onClick={() => state.loadShareAsDiceKey()}>load next share</PushButton>
				</ButtonRow>
			<DiceKeyRecoveredRowView {...{state}} />
			<BottomInstructionRow>
				<ButtonRow>
					<PushButton onClick={() => onComplete()}>cancel</PushButton>
					<PushButton $invisible={state.derivedDiceKey == null} onClick={() => onComplete(state.derivedDiceKey)}>done</PushButton>
				</ButtonRow>
			</BottomInstructionRow>
		</SecretSharingViewContainer>
	);
});


addPreview("RecoverSharedSecret", () => ( 
  <SecretSharingRecoveryView state={
			new SecretSharingRecoveryState(NavigationPathState.root, {})
	 	} 
		onComplete={() => {alert("complete")}}
	/>
));