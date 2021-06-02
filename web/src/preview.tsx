import ReactDOM from "react-dom";
import * as React from "react";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";
import { Preview_ScanDiceKeyView } from "./views/LoadingDiceKeys/ScanDiceKeyView";
import { Preview_EnterDiceKeyView } from "./views/LoadingDiceKeys/EnterDiceKeyView";
import { Preview_SeedHardwareKeyView } from "./views/WithSelectedDiceKey/SeedHardwareKeyView";
import { Preview_StickerSheetView } from "./views/SVG/StickerSheetView";
import { Preview_StickerTargetSheetView } from "./views/SVG/StickerTargetSheetView";
import { Preview_FaceCopyingView } from "./views/SVG/FaceCopyingView";
import { getPreview, addPreviewWithMargins, addCenteredPreview, getPreviewNames } from "./views/basics/Previews";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";
import {ButtonsCSS} from "./css"
import {WindowRoutingView} from "./views/WindowTopLevelView";
import { DiceKeyMemoryStore } from "./state";

// To make sure everything is loaded, load the view for the app even if we're not using it.
if (!WindowRoutingView) {
  console.log("Failed to load the app top level view.")
}

const ApplicationErrorState = new ErrorState();

addCenteredPreview("EnterDiceKey", () => ( <Preview_EnterDiceKeyView/> ));
addCenteredPreview("ScanDiceKey", () => ( <Preview_ScanDiceKeyView/> ));
addCenteredPreview("SeedHardwareKey", () => ( <Preview_SeedHardwareKeyView/> ));
addPreviewWithMargins("StickerSheet", () => ( <Preview_StickerSheetView />));
addPreviewWithMargins("StickerTargetSheet", () => ( <Preview_StickerTargetSheetView />));
addPreviewWithMargins("FaceCopying", () => ( <Preview_FaceCopyingView />));


class PreviewState {
  constructor (public name: string | undefined =
    (new URL(window.location.href).searchParams.get("name") ?? undefined)
  ) {
    makeAutoObservable(this);
  }
  setName = action( (name: string) => {
    this.name = name;
    window.history.pushState("", "", `?name=${name}`);
  });
  get preview() { return getPreview(this.name) };
}

const previewState = new PreviewState();

const Previews = observer ( () => {
  const {preview} = previewState;
  if (preview != null && typeof preview === "function") {
    return preview();
  } else {
    return (
      <div style={{display: "flex", flexDirection: "column", justifyContent: "space-around", alignContent: "space-around"}}>
        {getPreviewNames().map( name => (
          <button key={name} className={ButtonsCSS.PushButton} onClick={() => previewState.setName(name)}>{name}</button>
        ))}
      </div>
    );
  }
});

window.addEventListener('load', () => {
  DiceKeyMemoryStore.onReady( () => {
    ReactDOM.render((
      <ErrorHandler errorState={ApplicationErrorState}>
          <Previews />
      </ErrorHandler>
    ), document.getElementById("app_container"));
  })
});

if (window.opener) {
  window.opener?.postMessage("ready", "*");
}
