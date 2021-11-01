import React from "react";
import { CenterRow, PreviewView } from "./Layout";


const PreviewMap = new Map<string, () => JSX.Element | null>();

export const getPreview = (name?: string) => PreviewMap.get(name?.toLocaleLowerCase() ?? "");
export const getPreviewNames = () => ([...(PreviewMap.keys())]).sort();
export const addPreview = (name: string, previewFn: () => JSX.Element | null ) =>
  PreviewMap.set(name.toLocaleLowerCase(), previewFn);
export const addPreviewWithMargins = (name: string, previewFn: () => JSX.Element | null ) =>
  addPreview(name, () => (<PreviewView>{ previewFn() }</PreviewView>))
export const addCenteredPreview = (name: string, previewFn: () => JSX.Element | null ) =>
  addPreview(name, () => (<CenterRow>{ previewFn() }</CenterRow>))
