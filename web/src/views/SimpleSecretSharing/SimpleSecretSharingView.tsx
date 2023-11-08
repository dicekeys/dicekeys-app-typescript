import { observer } from "mobx-react";
import React from "react";
import { SimpleSecretSharingState } from "./SimpleSecretSharingState";
import { DiceKeyView } from "../SVG/DiceKeyView";
import { addPreviewWithMargins } from "../basics/Previews";
import { NavigationPathState } from "../../state/core/NavigationPathState";
import { DiceKeyWithoutKeyId, faceLetterAndDigitToNumber0to149 } from "../../dicekeys/DiceKey";
import styled from "styled-components";


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
	gap: 1vw;
`




export const SimpleSecretSharingView = observer(({
	simplesSecretSharingState,
}: SimpleSecretSharingProps
) => {
	if (simplesSecretSharingState == null) return null;
	const {
		diceKeyToSplitIntoShares,
		derivedDiceKeys,
	} = simplesSecretSharingState;
	return (
		<SimpleSecretSharingViewContainer>
			<SimpleSecretSharingViewRow>
				<DiceKeyView  
					size={`min(25vw,40vh)`}
					diceKey={diceKeyToSplitIntoShares}
				/>
			</SimpleSecretSharingViewRow>
			<SimpleSecretSharingViewRow>
				{ derivedDiceKeys.map( derivedDiceKey => (
					<div key={ faceLetterAndDigitToNumber0to149(derivedDiceKey.centerFace) }>
						<DiceKeyView  
							size={`min(${ (75 / derivedDiceKeys.length) -1 }vw, 25vw, 40vh)`}
							diceKey={derivedDiceKey}
						/>
					</div>
				)) }
			</SimpleSecretSharingViewRow>
		</SimpleSecretSharingViewContainer>
	);
});

addPreviewWithMargins("SimpleSecretSharing", () => ( 
  <SimpleSecretSharingView simplesSecretSharingState={
		new SimpleSecretSharingState(NavigationPathState.root, {userSpecifiedDiceKeyToSplitIntoShares: DiceKeyWithoutKeyId.testExample})
	 } />
));