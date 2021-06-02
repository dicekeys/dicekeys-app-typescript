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
  <figure className={LayoutCss.ResizableImage}>
    <img {...props} />
  </figure>
)

export const Center = ({children}: React.PropsWithChildren<{}>) => (
  <div className={LayoutCss.Center}>
    {children}
  </div>
)

export const ContentBox  = ({children}: React.PropsWithChildren<{}>) => (
  <div className={LayoutCss.ContentBox}>
    {children}
  </div>
);

export const ContentRow  = ({children}: React.PropsWithChildren<{}>) => (
  <div className={LayoutCss.ContentRow}>
    {children}
  </div>
);

export const CenteredColumn = ({children}: React.PropsWithChildren<{}>) => (
  <div className={LayoutCss.CenteredColumn}>
    {children}
  </div>
)

export const PaddedContentBox  = ({children}: React.PropsWithChildren<{}>) => (
  <div className={LayoutCss.PaddedContentBox}>
    {children}
  </div>
);