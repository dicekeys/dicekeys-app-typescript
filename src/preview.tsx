import ReactDOM from "react-dom";
import * as React from "react";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";
import { Preview_ScanDiceKeyView } from "./views/LoadingDiceKeys/ScanDiceKeyView";
import { Preview_EnterDiceKeyView } from "./views/LoadingDiceKeys/EnterDiceKeyView";
import { Preview_SeedHardwareKeyView } from "./views/WithSelectedDiceKey/SeedHardwareKeyView";
import { Preview_SelectedDiceKeyView } from "./views/WithSelectedDiceKey/SelectedDiceKeyView";
import { Preview_DerivationView } from "./views/Recipes/DerivationView";
import { Preview_AssemblyInstructions } from "./views/AssemblyInstructionsView";
import { Preview_StickerSheetView } from "./views/SVG/StickerSheetView";
import { Preview_StickerTargetSheetView } from "./views/SVG/StickerTargetSheetView";
import { Preview_FaceCopyingView } from "./views/SVG/FaceCopyingView";
import { getPreview, addPreview, addCenteredPreview, getPreviewNames } from "./views/basics/Previews";
import { action, makeAutoObservable } from "mobx";
import { observer } from "mobx-react";

const ApplicationErrorState = new ErrorState();

addCenteredPreview("AssemblyInstructions", () => ( <Preview_AssemblyInstructions/> ));
addCenteredPreview("EnterDiceKey", () => ( <Preview_EnterDiceKeyView/> ));
addCenteredPreview("ScanDiceKey", () => ( <Preview_ScanDiceKeyView/> ));
addCenteredPreview("SeedHardwareKey", () => ( <Preview_SeedHardwareKeyView/> ));
addCenteredPreview("SelectedDiceKey", () => ( <Preview_SelectedDiceKeyView /> ));
addPreview("Derivation", () => ( <Preview_DerivationView />));
addPreview("StickerSheet", () => ( <Preview_StickerSheetView />));
addPreview("StickerTargetSheet", () => ( <Preview_StickerTargetSheetView />));
addPreview("FaceCopying", () => ( <Preview_FaceCopyingView />));


class PreviewState {
  constructor (public name: string | undefined =
    (new URL(window.location.href).searchParams.get("component") ?? undefined)
  ) {
    makeAutoObservable(this);
  }
  setName = action( (name: string) => this.name = name );
  get preview() { return getPreview(this.name)?.() };
}

const previewState = new PreviewState();

const Previews = observer ( () => (
  previewState.preview ?? (
    <div style={{display: "flex", flexDirection: "column", justifyContent: "center"}}>
      {getPreviewNames().map( name => (
        <button onClick={() => previewState.setName(name)}>{name}</button>
      ))}
    </div>
  )
));

window.addEventListener('load', () => {
  ReactDOM.render((
    <ErrorHandler errorState={ApplicationErrorState}>
        <Previews />
    </ErrorHandler>
  ), document.getElementById("app_container"));
});

if (window.opener) {
  window.opener?.postMessage("ready", "*");
}
