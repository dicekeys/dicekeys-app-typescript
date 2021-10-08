
import React from "react";
import {observer} from "mobx-react";
import css from "./StepFooterView.module.css";
import { visibility } from "../../utilities/visibility";
import { PushButton } from "../../css/Button";

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
      <PushButton style={visibility(props.pprev != null)} onClick={ props.pprev } >&lt;&lt;</PushButton>
      <PushButton style={visibility(props.prev != null)} onClick={ props.prev } >&lt; previous</PushButton>
      <div className={css.SpaceBetweenLeftAndRightButtons}></div>
      <PushButton style={visibility(props.next != null)} onClick={ props.next } >{props.nextIsDone ? "done" : "next"} &gt;</PushButton>
      <PushButton style={visibility(props.nnext != null)} onClick={ props.nnext } >&gt;&gt;</PushButton>
    </div>
  </div>
));