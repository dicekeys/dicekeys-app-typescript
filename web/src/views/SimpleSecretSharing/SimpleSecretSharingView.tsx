import { observer } from "mobx-react";
import React from "react";
import { SimpleSecretSharingState } from "./SimpleSecretSharingState";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { addPreviewWithMargins } from "../basics/Previews";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { DiceKeyWithoutKeyId, FaceLetter, FaceLetters, faceLetterAndDigitToNumber0to149 } from "../../dicekeys/DiceKey";
import styled from "styled-components";
import { CharButton } from "../basics";
import { LoadDiceKeyContentPaneView } from "../LoadingDiceKeys/LoadDiceKeyView";


export interface SimpleSecretSharingProps {
	simplesSecretSharingState: SimpleSecretSharingState;
}

const maxViewWidth = 90;

const SimpleSecretSharingViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: flex-start;
  align-items: center;
  flex-grow: 1;
`;

const SimpleSecretSharingViewRow = styled.div<{$numShares?: number}>`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
	${ ({$numShares: numShares}) => numShares == null ? `` : 
		`gap: ${ 0.5 * maxViewWidth / ((1 * numShares) + (.5 * (numShares -1)) )}vw;` }
`;

const LabeledDiceKey = styled.div`
  display: flex;
  flex-direction: column;
	justify-content: flex-start;
	align-items: center;
`;

const DiceKeyLabel = styled.div`
	display: block;
`;

const DiceKeyTopLabel = styled(DiceKeyLabel)`
`;
const DiceKeyBottomLabel = styled(DiceKeyLabel)<{$numShares?: number}>`
	font-size: ${ (p) => (p.$numShares == null  || p.$numShares < 4) ? `1vw` : `${4/p.$numShares}vw` };
`;

const NumberIncrementDecrementSpan = styled.span`
	display: block;
	/* display: flex;
	flex-direction: row; */
`;

const NumberIncrementDecrement = observer( ({setValue, ...args}: {
	setValue: (value: number) => void;
	value: number | (() => number);
	minValue?: number | (() => (number | undefined));
	maxValue?: number | (() => (number | undefined));
}) => {
	const getValue: () => number = (typeof args.value === "function") ? args.value : (() => args.value as number);
	const getMinValue = () => (typeof args.minValue === "function" ? args.minValue() : args.minValue) ?? Number.MIN_SAFE_INTEGER;
	const getMaxValue = () => (typeof args.maxValue === "function" ? args.maxValue() : args.maxValue) ?? Number.MAX_SAFE_INTEGER;
	return (<NumberIncrementDecrementSpan>
			<CharButton disabled={getValue() <= getMinValue()} onClick={() => setValue(getValue() - 1)}>-</CharButton>
			<span>{getValue()}</span>
			<CharButton disabled={getValue() >= getMaxValue()} onClick={() => setValue(getValue() + 1)}>+</CharButton>
		</NumberIncrementDecrementSpan>);
});

const SimpleSecretSharingControlRowView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	return (
		<SimpleSecretSharingViewRow>
			<div>
				<label>Total number of shares to generate:</label>
				<NumberIncrementDecrement
					value={() => simplesSecretSharingState.numSharesToDisplay}
					setValue={simplesSecretSharingState.setNumSharesToDisplay}
					minValue={() => simplesSecretSharingState.minSharesToDecode}
				/>
				<label>Minimum shares to recover the DiceKey to be shared:</label>
				<NumberIncrementDecrement
					value={() => simplesSecretSharingState.minSharesToDecode}
					setValue={simplesSecretSharingState.setMinSharesToDecode}
					minValue={1}
					maxValue={() => simplesSecretSharingState.numSharesToDisplay}
				/>
				<label>Center letters of Shares start with:</label>
				<select value={simplesSecretSharingState.startDerivedShareCenterFacesAtLetter}
					onChange={ e => {
						simplesSecretSharingState.startDerivedShareCenterFacesAtLetter = e.currentTarget.value as FaceLetter}
					}
				>{
					FaceLetters.map( letter => (
						<option key={letter} value={letter}>{letter}</option>
					))
				}
				</select>
			</div>
		</SimpleSecretSharingViewRow>
	);
});

export const SimpleSecretSharingView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	const {
		diceKeyToSplitIntoShares,
		sharesAsDiceKeys,
	} = simplesSecretSharingState;
	if (simplesSecretSharingState.loadShareAsDiceKeyState) {
		return (
			<LoadDiceKeyContentPaneView
				state={simplesSecretSharingState.loadShareAsDiceKeyState}
				onDiceKeyReadOrCancelled={simplesSecretSharingState.onShareAsDiceKeyLoadCompletedOrCancelled}
			/>);
	}
	return (
		<SimpleSecretSharingViewContainer>
			<SimpleSecretSharingViewRow>
				<LabeledDiceKey>
					<DiceKeyTopLabel>
						The DiceKey Being Shared
					</DiceKeyTopLabel>
					<DiceKeyView  
						size={`min(25vw,40vh)`}
						diceKey={diceKeyToSplitIntoShares}
					/>
				</LabeledDiceKey>
			</SimpleSecretSharingViewRow>
			<SimpleSecretSharingControlRowView {...{simplesSecretSharingState}} />
			<SimpleSecretSharingViewRow $numShares={sharesAsDiceKeys.length} >
				{ sharesAsDiceKeys.map( ({source, diceKey}, i) => (
					<LabeledDiceKey key={ faceLetterAndDigitToNumber0to149((diceKey).centerFace) }>
						<DiceKeyTopLabel>
							Share { diceKey.centerFace.letter }
						</DiceKeyTopLabel>
						<DiceKeyView
							key={faceLetterAndDigitToNumber0to149(diceKey.centerFace)}
							size={`min(${ (maxViewWidth / ((1 * sharesAsDiceKeys.length) + (.5 * (sharesAsDiceKeys.length -1))) )}vw, 25vw, 40vh)`}
							diceKey={diceKey}
						/><DiceKeyBottomLabel $numShares={sharesAsDiceKeys.length}>{
							source === "interpolated" ? (<span>calculated from the {i > 1 ? `${i} DiceKeys` : `DiceKey`} to the left</span>) :
							source === "pseudorandom" ? (<><span>calculated from DiceKey being shared</span><br/><span onClick={() => simplesSecretSharingState.loadShareAsDiceKey()}>(replace with newly random DiceKey)</span></>) :
							(<><span>scanned</span><span onClick={() => simplesSecretSharingState.removeUserLoadedShare( diceKey.centerFace.letter )}>remove</span></>)
						}</DiceKeyBottomLabel>
					</LabeledDiceKey>
				)) }
			</SimpleSecretSharingViewRow>
		</SimpleSecretSharingViewContainer>
	);
});

addPreviewWithMargins("SimpleSecretSharing", () => ( 
  <SimpleSecretSharingView simplesSecretSharingState={
		new SimpleSecretSharingState(NavigationPathState.root, {
			userSpecifiedDiceKeyToSplitIntoShares: DiceKeyWithoutKeyId.testExample,
			numSharesToDisplay: 3,
		})
	 } />
));