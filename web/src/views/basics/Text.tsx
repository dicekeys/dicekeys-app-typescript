import styled from "styled-components";
import { cssCalc, cssCalcInputExpr } from "../../utilities";

export const InstructionTextHeight = `1.65rem`;
export const InstructionLineHeight = cssCalc(`1.2 * ${cssCalcInputExpr(InstructionTextHeight)}`)
export const InstructionVerticalMargin = `0.5rem`;

// 2 * ${cssCalcInputExpr(InstructionVerticalMargin)} + 
export const InstructionHeightForLines = <LINES extends number>(lines: LINES) =>
  cssCalc(`${lines} * ${cssCalcInputExpr(InstructionLineHeight)}`);

export const Instruction = styled.div`
  font-size: ${InstructionTextHeight};
  margin-top: ${InstructionVerticalMargin};
  margin-bottom: ${InstructionVerticalMargin};
  width: fit-content;
  user-select: none;
`;
