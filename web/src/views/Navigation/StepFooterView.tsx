
import React from "react";
import {observer} from "mobx-react";
import css from "./StepFooterView.module.css";
import { visibility } from "../../utilities/visibility";

interface StepFooterViewProps {
  prev?: () => any;
  pprev?: () => any;
  next?: () => any;
  nnext?: () => any;
  nextIsDone?: boolean;
  aboveFooter?: JSX.Element | undefined;
}

export const StepFooterView = observer ( (props: StepFooterViewProps) => (
  <div className={css.StepFooter}>
    { props.aboveFooter == null ? null : (
      <div className={css.StepFooterRow}>
        {props.aboveFooter}
      </div>
    ) }
    <div className={css.StepFooterRow}>
      <button className={css.StepButton} style={visibility(props.pprev != null)} onClick={ props.pprev } >&lt;&lt;</button>
      <button className={css.StepButton} style={visibility(props.prev != null)} onClick={ props.prev } >&lt; previous</button>
      <div className={css.SpaceBetweenLeftAndRightButtons}></div>
      <button className={css.StepButton} style={visibility(props.next != null)} onClick={ props.next } >{props.nextIsDone ? "done" : "next"} &gt;</button>
      <button className={css.StepButton} style={visibility(props.nnext != null)} onClick={ props.nnext } >&gt;&gt;</button>
    </div>
  </div>
));