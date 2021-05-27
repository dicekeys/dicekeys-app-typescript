import React from "react";
import css from "./Text.module.css";

export const Instruction = ({children}: React.PropsWithChildren<{}>) => (
  <div className={css.Instruction}>{children}</div>
)
