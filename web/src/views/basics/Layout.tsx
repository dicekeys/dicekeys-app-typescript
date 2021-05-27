import React, { PropsWithChildren } from "react";
import css from "./basic.module.css";
import LayoutCss from "../../css/Layout.module.css";
export const PreviewView = ({children}: PropsWithChildren<{}>) => (
  <div className={css.PreviewContainer}>
    {children}
  </div>
);

export const Spacer = () => (
  <div className={LayoutCss.Spacer} />
);

export const ResizableImage = (props: {src: string, alt: string}) => (
  <figure className={css.ResizableImage}>
    <img {...props} />
  </figure>
)
