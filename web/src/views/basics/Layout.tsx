import React, { PropsWithChildren } from "react";
import css from "./basic.module.css";
import LayoutCss from "../../css/Layout.module.css";
import styled from "styled-components";

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

export const ContentBox  = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-content: stretch;
  overflow: hide;
  flex-grow: 1;
  align-self: stretch;
  justify-content: space-around;
`;

export const ContentRow  = styled.div`
  display: flex;
  align-self: stretch;
  flex-direction: column;
  align-content: stretch;
  overflow: hide;
  justify-content: center;
  flex-direction: row;
  align-items: center;
  flex-grow: 1;
`;

export const ColumnCentered = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  align-content: center;
  flex-grow: 5;
  flex-shrink: 5;
`;

export const ColumnVerticallyCentered = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  flex-grow: 1;
`;

export const RowCentered = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
`;

export const ColumnStretched = styled.div`
  display: flex;
  flex-direction: column;
  align-self: stretch;
  flex-grow: 5;
  flex-shrink: 5;
  justify-content: normal;
  align-content: space-around;
`;

export const PaddedContentBox = styled(ContentBox)`
  margin-left: 1.5rem;
  margin-right: 1.5rem;
  margin-bottom: 0.25rem;
  margin-top: 0.25rem;
`;