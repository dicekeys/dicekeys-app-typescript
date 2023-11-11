import { observer } from "mobx-react";
import React from "react";
import { SimpleSecretSharingState } from "./SimpleSecretSharingState";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { addPreviewWithMargins } from "../basics/Previews";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { DiceKeyWithoutKeyId, FaceLetter, FaceLetters, faceLetterAndDigitToNumber0to149 } from "../../dicekeys/DiceKey";
import styled from "styled-components";
import { CharButton } from "../basics";


export interface SimpleSecretSharingProps {
	simplesSecretSharingState: SimpleSecretSharingState;
}

const SimpleSecretSharingViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: space-around;
  align-items: center;
  flex-grow: 1;
`

const SimpleSecretSharingViewRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  flex-grow: 1;
`

const NumberIncrementDecrement = observer( ({setValue, ...args}: {
	setValue: (value: number) => void;
	value: number | (() => number);
	minValue?: number | (() => (number | undefined));
	maxValue?: number | (() => (number | undefined));
}) => {
	const getValue: () => number = (typeof args.value === "function") ? args.value : (() => args.value as number);
	const getMinValue = () => (typeof args.minValue === "function" ? args.minValue() : args.minValue) ?? Number.MIN_SAFE_INTEGER;
	const getMaxValue = () => (typeof args.maxValue === "function" ? args.maxValue() : args.maxValue) ?? Number.MAX_SAFE_INTEGER;
	return (<>
			<CharButton disabled={getValue() <= getMinValue()} onClick={() => setValue(getValue() - 1)}>-</CharButton>
			<span>{getValue()}</span>
			<CharButton disabled={getValue() >= getMaxValue()} onClick={() => setValue(getValue() + 1)}>+</CharButton>
		</>);
});

const SimpleSecretSharingControlRowView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	return (
		<SimpleSecretSharingViewRow>
			<NumberIncrementDecrement
				value={() => simplesSecretSharingState.minSharesToDecode}
				setValue={simplesSecretSharingState.setMinSharesToDecode}
				minValue={1}
				maxValue={() => simplesSecretSharingState.numSharesToDisplay}
			/>
			<NumberIncrementDecrement
				value={() => simplesSecretSharingState.numSharesToDisplay}
				setValue={simplesSecretSharingState.setNumSharesToDisplay}
				minValue={() => simplesSecretSharingState.minSharesToDecode}
			/>
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
		</SimpleSecretSharingViewRow>
	);
});

export const SimpleSecretSharingView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	if (simplesSecretSharingState == null) return null;
	const {
		diceKeyToSplitIntoShares,
		sharesAsDiceKeys,
	} = simplesSecretSharingState;
	return (
		<SimpleSecretSharingViewContainer>
			<SimpleSecretSharingViewRow>
				<DiceKeyView  
					size={`min(25vw,40vh)`}
					diceKey={diceKeyToSplitIntoShares}
				/>
			</SimpleSecretSharingViewRow>
			<SimpleSecretSharingControlRowView {...{simplesSecretSharingState}} />
			<SimpleSecretSharingViewRow style={{gap: `${ 0.5 * 80 / ((1 * sharesAsDiceKeys.length) + (.5 * (sharesAsDiceKeys.length -1)) )}vw`}}>
				{ sharesAsDiceKeys.map( shareAsDiceKey => (
					<div key={ faceLetterAndDigitToNumber0to149(shareAsDiceKey.centerFace) }>
						<DiceKeyView
							key={faceLetterAndDigitToNumber0to149(shareAsDiceKey.centerFace)}
							size={`min(${ (80 / ((1 * sharesAsDiceKeys.length) + (.5 * (sharesAsDiceKeys.length -1))) )}vw, 25vw, 40vh)`}
							diceKey={shareAsDiceKey}
						/>
					</div>
				)) }
			</SimpleSecretSharingViewRow>
			<SimpleSecretSharingViewRow>
				{ simplesSecretSharingState.random24YValuesForUserSpecifiedDiceKey.length },
				{ sharesAsDiceKeys.length }
			</SimpleSecretSharingViewRow>
		</SimpleSecretSharingViewContainer>
	);
});

addPreviewWithMargins("SimpleSecretSharing", () => ( 
  <SimpleSecretSharingView simplesSecretSharingState={
		new SimpleSecretSharingState(NavigationPathState.root, {
			userSpecifiedDiceKeyToSplitIntoShares: DiceKeyWithoutKeyId.testExample,
			numSharesToDisplay: 5,
		})
	 } />
));