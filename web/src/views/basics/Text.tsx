import styled, {css} from "styled-components";
import { cssCalc, cssCalcTyped, cssExprWithoutCalc } from "../../utilities";

export const InstructionTextHeight = `1.65rem`;
export const InstructionLineHeight = cssCalcTyped(`1.2 * ${cssExprWithoutCalc(InstructionTextHeight)}`);
export const InstructionVerticalMargin = `0.5rem`;

// export const InstructionHeightForLines = <LINES extends number>(lines: LINES) =>
//   cssCalcTyped(`${lines} * ${cssCalcInputExpr(InstructionLineHeight)}`);

export const Instruction = styled.div<{minLines?: number}>`
  ${({minLines}) => minLines == null ? "" : css`min-height: ${cssCalc`${minLines} * ${InstructionLineHeight}`}; max-height: 100vh;` }
  font-size: ${InstructionTextHeight};
  margin-top: ${InstructionVerticalMargin};
  margin-bottom: ${InstructionVerticalMargin};
  width: fit-content;
  user-select: none;
`;
