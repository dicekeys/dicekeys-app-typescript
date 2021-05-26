
import React from "react";
import {observer} from "mobx-react";
import css from "./StepFooterView.module.css";

interface StepFooterViewProps {
  // setStep?: (step: number) => any;
  // current?: number;
  // total?: number;
  prev?: () => any;
  pprev?: () => any;
  next?: () => any;
  nnext?: () => any;
  aboveFooter?: JSX.Element | undefined;
}

export const StepFooterView = observer ( (props: StepFooterViewProps) => {
  const {aboveFooter, pprev, prev, next, nnext} = props;
  return (
    <div className={css.StepFooter}>
      { aboveFooter == null ? null : (
        <div className={css.StepFooterRow}>
          {aboveFooter}
          {/* <button className={css.StepButton} hidden={onMaySkip == null} onClick={ onClickFn(onMaySkip) } >Let me skip this step</button> */}
        </div>
      ) }
      <div className={css.StepFooterRow}>
        <button className={css.StepButton} style={pprev == null ? {visibility: "hidden"} : {}} onClick={ pprev } >&lt;&lt;</button>
        <button className={css.StepButton} style={prev == null ? {visibility: "hidden"} : {}} onClick={ prev } >&lt; previous</button>
        <div className={css.SpaceBetweenLeftAndRightButtons}></div>
        <button className={css.StepButton} style={next == null ? {visibility: "hidden"} : {}} onClick={ next } >next &gt;</button>
        <button className={css.StepButton} style={nnext == null ? {visibility: "hidden"} : {}} onClick={ nnext } >&gt;&gt;</button>
      </div>
    </div>
)});