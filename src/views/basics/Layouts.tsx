import React, { PropsWithChildren } from "react";
import css from "./basic.module.css";

export const PreviewView = ({children}: PropsWithChildren<{}>) => (
  <div className={css.PreviewContainer}>
    {children}
  </div>
);