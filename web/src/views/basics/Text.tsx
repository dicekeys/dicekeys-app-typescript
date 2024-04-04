import styled, {css} from "styled-components";
import { cssCalcTyped, cssExprWithoutCalc } from "../../utilities/cssCalc";

export const InstructionTextHeightRem = 1.65 as const;
export const InstructionTextHeight = `${InstructionTextHeightRem}rem` as const;
export const InstructionLineHeight = cssExprWithoutCalc(`1.2 * ${InstructionTextHeight}`);
export const InstructionVerticalMargin = `0.5rem`;

// export const InstructionHeightForLines = <LINES extends number>(lines: LINES) =>
//   cssExprWithoutCalc(`${lines} * ${cssCalcInputExpr(InstructionLineHeight)}`);

export const Instruction = styled.div<{$minLines?: number}>`
  ${({$minLines: minLines}) => minLines == null ? "" : css`min-height: ${cssCalcTyped(`${minLines} * ${InstructionLineHeight}`)}; max-height: 100vh;` }
  font-size: ${InstructionTextHeight};
  margin-top: ${InstructionVerticalMargin};
  margin-bottom: ${InstructionVerticalMargin};
  width: fit-content;
  user-select: none;
`;

export const Instruction2TextHeight = `1.35rem`;
export const Instruction2LineHeight = cssExprWithoutCalc(`1.2 * ${Instruction2TextHeight}`);
export const Instruction2VerticalMargin = `0.5rem`;


export const Instruction2 = styled.div<{$minLines?: number}>`
  ${({$minLines: minLines}) => minLines == null ? "" : css`min-height: ${cssCalcTyped(`${minLines} * ${InstructionLineHeight}`)}; max-height: 100vh;` }
  font-size: ${Instruction2TextHeight};
  margin-top: ${Instruction2VerticalMargin};
  margin-bottom: ${Instruction2VerticalMargin};
  width: fit-content;
  user-select: none;
`;
