/* eslint-disable @typescript-eslint/no-unused-vars */
import * as React from "react";
import { createRoot } from "react-dom/client";
import { ErrorHandler } from "../views/ErrorHandler";

import * as _ from "../views/SimpleSecretSharing/SimpleSecretSharingView";
import * as SecretSharingRecoveryView from "../views/SimpleSecretSharing/SecretSharingRecoveryView";
import {PrintDiceKeyView as _1} from "../views/SimpleSecretSharing/PrintDiceKeyView";
import {Die3dView} from "../views/SimpleSecretSharing/Die3dView";
if (_ == null || _1 == null || Die3dView == null || SecretSharingRecoveryView == null) {
  throw "";
}

import { Preview_ScanDiceKeyView } from "../views/LoadingDiceKeys/ScanDiceKeyView";
import { Preview_EnterDiceKeyView } from "../views/LoadingDiceKeys/EnterDiceKeyView";
import { Preview_StickerSheetView } from "../views/SVG/StickerSheetView";
import { Preview_StickerTargetSheetView } from "../views/SVG/StickerTargetSheetView";
import { Preview_FaceCopyingView } from "../views/SVG/FaceCopyingView";
import { PREVIEW_DiceKeySelectorView } from "../views/DiceKeySelectorView";
import { getPreview, addPreviewWithMargins, addCenteredPreview, getPreviewNames } from "../views/basics/Previews";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import {WindowRoutingView} from "../views/WindowTopLevelView";
import { DiceKeyMemoryStore } from "../state";
import { PushButton } from "../css/Button";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { lightTheme } from "../css/lightTheme";
import { PrimaryView } from "../css";
import { throwIfNull } from "../utilities/throwIfNull";



// To make sure everything is loaded, load the view for the app even if we're not using it.
if (!WindowRoutingView) {
  console.log("Failed to load the app top level view.")
}

addCenteredPreview("EnterDiceKey", () => ( <Preview_EnterDiceKeyView/> ));
addCenteredPreview("ScanDiceKey", () => ( <Preview_ScanDiceKeyView/> ));
addPreviewWithMargins("StickerSheet", () => ( <Preview_StickerSheetView />));
addPreviewWithMargins("StickerTargetSheet", () => ( <Preview_StickerTargetSheetView />));
addPreviewWithMargins("FaceCopying", () => ( <Preview_FaceCopyingView />));
addCenteredPreview("DiceKeySelectorView", () => ( <PREVIEW_DiceKeySelectorView/>))

class PreviewState {
  constructor (public name: string | undefined =
    (new URL(window.location.href).searchParams.get("name") ?? undefined)
  ) {
    makeAutoObservable(this);
  }
  setName = action( (name: string) => {
    console.log("call to PreviewState.setName");
    this.name = name;
    window.history.pushState("", "", `?name=${name}`);
  });
  get preview() { return getPreview(this.name) }
}

const previewState = new PreviewState();

const PreviewDiv = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-content: space-around;
`;

const Previews = observer ( () => {
  const {preview} = previewState;
  if (preview != null && typeof preview === "function") {
    return preview();
  } else {
    return (
      <PreviewDiv>
        {getPreviewNames().map( name => (
          <PushButton key={name} onClick={() => previewState.setName(name)}>{name}</PushButton>
        ))}
      </PreviewDiv>
    );
  }
});

window.addEventListener('load', () => {
  DiceKeyMemoryStore.onReady( () => {
    const container = throwIfNull(document.getElementById("app_container"));
    const root = createRoot(container);
    root.render((
      <ErrorHandler>
        <ThemeProvider theme={lightTheme}>
          <PrimaryView>
            <Previews />
          </PrimaryView>
        </ThemeProvider>
      </ErrorHandler>
    ));
  })
});

if (window.opener) {
  window.opener?.postMessage("ready", "*");
}
