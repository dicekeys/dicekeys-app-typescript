import React from "react";
import Layout from "../Layout.module.css"
import { PreviewView } from "./Layout";

export const Center = ({children}: React.PropsWithChildren<{}>) => (
  <div className={Layout.PrimaryView} >
    {children}
  </div>
);

const PreviewMap = new Map<string, () => JSX.Element | null>();

export const getPreview = (name?: string) => PreviewMap.get(name?.toLocaleLowerCase() ?? "");
export const getPreviewNames = () => ([...(PreviewMap.keys())]).sort();
export const addRawPreview = (name: string, previewFn: () => JSX.Element | null ) =>
  PreviewMap.set(name.toLocaleLowerCase(), previewFn);
export const addPreview = (name: string, previewFn: () => JSX.Element | null ) =>
  addRawPreview(name, () => (<PreviewView>{ previewFn() }</PreviewView>))
export const addCenteredPreview = (name: string, previewFn: () => JSX.Element | null ) =>
  addRawPreview(name, () => (<Center>{ previewFn() }</Center>))
