import styled from "styled-components";
import { InstructionTextHeight } from "../basics";

export const maxViewWidth = 90;

// const RowViewHeightInfo = 15 as const;
const RowViewHeightDiceKeys = 20 as const;
export const RowViewHeightTopInstruction  = 10 as const;
export const RowViewHeightDiceKey = RowViewHeightDiceKeys;
export const RowViewHeightShares = RowViewHeightDiceKeys;
export const BottomInstructionAndAction = 5 as const;

const SecretSharingHelperRow = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
`;

export const TopInstructionRow = styled(SecretSharingHelperRow)`
	min-height: calc(min(${RowViewHeightTopInstruction}vh, 3 * ${InstructionTextHeight}));
	justify-content: flex-end;
`;

export const BottomInstructionRow = styled(SecretSharingHelperRow)`
	min-height: ${BottomInstructionAndAction}vh;
	justify-content: flex-start;
`;

export const SecretSharingSharesRow = styled(SecretSharingHelperRow)`
	height: ${RowViewHeightDiceKeys}vh;
`;

export const ShareLetter = styled.span`
	font-weight: bold;
`;

export const SecretSharingViewContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  justify-content: flex-start;
  align-items: center;
  flex-grow: 1;
	gap: 2vh;
	max-width: ${maxViewWidth}vw;
	margin-left: ${50-maxViewWidth/2}vw;
	margin-right: ${50-maxViewWidth/2}vw;
`;

export const ChoiceText = styled.div`
	font-size: ${InstructionTextHeight};
	font-family: sans-serif;
	text-align: center;
	margin-left: auto;
	margin-right: auto;
`;

export const ChoiceSelect = styled.select`
	font-size: ${InstructionTextHeight};
`