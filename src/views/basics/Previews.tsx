import React from "react";
import Layout from "../Layout.module.css"
import { PreviewView } from "./Layout";

export const Center = ({children}: React.PropsWithChildren<{}>) => (
  <div className={Layout.PrimaryView} >
    {children}
  </div>
);

const PreviewMap = new Map<string, () => JSX.Element>();

export const getPreview = (name: string) => PreviewMap.get(name.toLocaleLowerCase());

export const addRawPreview = (name: string, previewFn: () => JSX.Element) =>
  PreviewMap.set(name.toLocaleLowerCase(), previewFn);
export const addPreview = (name: string, previewFn: () => JSX.Element) =>
  addRawPreview(name, () => (<PreviewView>{ previewFn() }</PreviewView>))
export const addCenteredPreview = (name: string, previewFn: () => JSX.Element) =>
  addRawPreview(name, () => (<Center>{ previewFn() }</Center>))
