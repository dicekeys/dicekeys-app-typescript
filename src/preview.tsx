import ReactDOM from "react-dom";
import * as React from "react";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";
import { PreviewView } from "./views/basics/Layout";
import { Preview_ScanDiceKeyView } from "./views/LoadingDiceKeys/ScanDiceKeyView";
import { Preview_EnterDiceKeyView } from "./views/LoadingDiceKeys/EnterDiceKeyView";
import { Layout } from "./css";
import { Preview_SeedHardwareKeyView } from "./views/WithSelectedDiceKey/SeedHardwareKeyView";
import { Preview_SelectedDiceKeyView } from "./views/WithSelectedDiceKey/SelectedDiceKeyView";
import { Preview_DerivationView } from "./views/Recipes/DerivationView";
import { Preview_AssemblyInstructions } from "./views/AssemblyInstructionsView";
import { Preview_BackupView } from "./views/BackupView";
import { Preview_StickerSheetView } from "./views/SVG/StickerSheetView";
import { Preview_StickerTargetSheetView } from "./views/SVG/StickerTargetSheetView";
import { Preview_FaceCopyingView } from "./views/SVG/FaceCopyingView";

const ApplicationErrorState = new ErrorState();

const Center = ({children}: React.PropsWithChildren<{}>) => (
  <div className={Layout.PrimaryView} >
    {children}
  </div>
);

const Previews = () => {
  const component = new URL(window.location.href).searchParams.get("component");
  switch(component?.toLocaleLowerCase()) {
    // Add preview components here
    case "AssemblyInstructions".toLocaleLowerCase(): return ( <Center><Preview_AssemblyInstructions/></Center> );
    case "EnterDiceKey".toLocaleLowerCase(): return ( <Center><Preview_EnterDiceKeyView/></Center> );
    case "ScanDiceKey".toLocaleLowerCase(): return ( <Center><Preview_ScanDiceKeyView/></Center> );
    case "SeedHardwareKey".toLocaleLowerCase(): return ( <Center><Preview_SeedHardwareKeyView/></Center> );
    case "SelectedDiceKey".toLocaleLowerCase(): return ( <Center><Preview_SelectedDiceKeyView /></Center> );
    case "Derivation".toLocaleLowerCase(): return ( <PreviewView><Preview_DerivationView /></PreviewView>);
    case "Backup".toLocaleLowerCase(): return ( <PreviewView><Preview_BackupView /></PreviewView>);
    case "StickerSheet".toLocaleLowerCase(): return ( <PreviewView><Preview_StickerSheetView /></PreviewView>);
    case "StickerTargetSheet".toLocaleLowerCase(): return ( <PreviewView><Preview_StickerTargetSheetView /></PreviewView>);
    case "FaceCopying".toLocaleLowerCase(): return ( <PreviewView><Preview_FaceCopyingView /></PreviewView>);
    //Preview_SelectedDiceKeyView
    // Handle component not found
    case undefined: return ( <div>Parameter "component" not defined.</div> );
    default: return (<div>No such component {component}</div>);
  }
}

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
