import React from "react";
import css from "./basic.module.css";

export const DivWithClass =
  (className: string) =>
    (props: React.PropsWithChildren<{}>) => (
      <div className={className}>{ props.children }</div>
    );

export const FormCard = DivWithClass(css.form_card);
export const InputCard = DivWithClass(css.input_card);
export const LabelAboveLeft = DivWithClass(css.label_above_left);
export const CenteredControls = DivWithClass(css.centered_controls);