import { observer } from "mobx-react";
import React from "react";
import { faceLetterAndDigitToNumber0to149, FaceLetter, DiceKey } from "../../../dicekeys/DiceKey";
import { DiceKeyView } from "../../SVG/DiceKeyView";
import { RowViewHeightShares, SecretSharingSharesRow, ShareLetter, maxViewWidth } from "../layout";
import styled from "styled-components";

const DiceKeyLabel = styled.div`
	display: block;
	text-align: center;
`;

const DiceKeyShareTitleAbove = styled(DiceKeyLabel)`
`;
const DiceKeyShareContentBelow = styled(DiceKeyLabel)<{$numShares?: number}>`
	font-size: ${ (p) => (p.$numShares == null  || p.$numShares < 4) ? `1vw` : `${3.75/p.$numShares}vw` };
`;

const DiceKeyShareContainer = styled.div<{$highlight?: boolean}>`
  display: flex;
  flex-direction: column;
	justify-content: flex-start;
	align-items: center;
	${ props => props.$highlight ? `background-color: ${ props.theme.colors.highlightBackground  };` : `` }
	gap: 0;
`;


export interface ShareEntryProps {
	numShares: number,
	diceKeySizeCss?: string,
	highlightIfCenterLetterIs?: FaceLetter | Set<FaceLetter>,
	diceKey: DiceKey,
	maxViewHeight?: number,
	contentAboveShare?: JSX.Element | string,
	highlight?: boolean,	
}

export const ShareEntry = observer(({
	diceKey, numShares, children,
	highlightIfCenterLetterIs,
	maxViewHeight = RowViewHeightShares,
	diceKeySizeCss =  `min(${(maxViewWidth / ((1 * numShares) + (0.5 * (numShares - 1))))}vw, 25vw, ${maxViewHeight}vh - 3rem)`,
	highlight = highlightIfCenterLetterIs == null ? false :
		(typeof highlightIfCenterLetterIs === "string" ? highlightIfCenterLetterIs === diceKey.centerFace.letter :
		highlightIfCenterLetterIs.has(diceKey.centerFace.letter)),
	contentAboveShare= (<>Share <ShareLetter>{diceKey.centerFace.letter}</ShareLetter></>)
}: React.PropsWithChildren<ShareEntryProps>) => (
	<DiceKeyShareContainer key={diceKey.centerFace.letter} $highlight={ highlight === true }>
		<DiceKeyShareTitleAbove>{contentAboveShare}</DiceKeyShareTitleAbove>
		<DiceKeyView
			key={faceLetterAndDigitToNumber0to149(diceKey.centerFace)}
			$size={diceKeySizeCss}
			diceKey={diceKey} />
		{children == null ? null : (<DiceKeyShareContentBelow $numShares={numShares}>{ children }</DiceKeyShareContentBelow>)}
	</DiceKeyShareContainer>
	)
)

export const RowOfSharesDiv = styled(SecretSharingSharesRow)<{$numShares: number}>`
	flex-direction: row;
  justify-content: center;
  align-items: center;
	gap: ${ ({$numShares}) => 0.5 * maxViewWidth / ((1 * $numShares) + (.5 * ($numShares -1)) )}vw;
`;



