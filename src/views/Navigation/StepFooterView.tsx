
import React from "react";
import {observer} from "mobx-react";
import css from "./StepFooterView.module.css";

type Step = number | undefined | (() => any);

interface StepFooterViewProps {
  current?: number;
  total?: number;
  setStep?: (step: number) => any;
  onMaySkip?: () => any;
  prev?: Step;
  pprev?: Step;
  next?: Step;
  nnext?: Step;
}

export const StepFooterView = observer ( (props: StepFooterViewProps) => {
  const {setStep, pprev, prev, next, nnext, onMaySkip} = props;
  const onClickFn = (step: Step): (() => any) | undefined =>
    typeof step === "number" ? (() => setStep?.(step)) :
      step;
  return (
    <div className={css.StepFooter}>
      <div className={css.StepFooterRow}>
      <button className={css.StepButton} hidden={onMaySkip == null} onClick={ onClickFn(onMaySkip) } >Let me skip this step</button>
      </div>
      <div className={css.StepFooterRow}>
        <button className={css.StepButton} hidden={pprev == null} onClick={ onClickFn(pprev) } >&lt;&lt;</button>
        <button className={css.StepButton} hidden={prev == null} onClick={ onClickFn(prev) } >&lt; previous</button>
        <div className={css.SpaceBetweenLeftAndRightButtons}></div>
        <button className={css.StepButton} hidden={next == null} onClick={ onClickFn(next) } >next &gt;</button>
        <button className={css.StepButton} hidden={nnext == null} onClick={ onClickFn(nnext) } >&gt;&gt;</button>
      </div>
    </div>
)});