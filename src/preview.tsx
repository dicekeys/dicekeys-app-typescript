import ReactDOM from "react-dom";
import * as React from "react";
import { ErrorHandler } from "./views/ErrorHandler";
import { ErrorState } from "./views/ErrorState";
import { PreviewView } from "./views/basics/Layouts";
import { Preview_ScanDiceKeyView } from "./views/LoadingDiceKeys/ScanDiceKeyView";
import { Preview_EnterDiceKeyView } from "./views/LoadingDiceKeys/EnterDiceKeyView";
import { Layout } from "./css";
import { Preview_SeedHardwareKeyView } from "./views/WithSelectedDiceKey/SeedHardwareKeyView";
import { Preview_SelectedDiceKeyView } from "./views/WithSelectedDiceKey/SelectedDiceKeyView";
import { Preview_DerivationView } from "./views/Recipes/DerivationView";

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
    case "EnterDiceKeyView".toLocaleLowerCase(): return ( <Center><Preview_EnterDiceKeyView/></Center> );
    case "ScanDiceKeyView".toLocaleLowerCase(): return ( <Center><Preview_ScanDiceKeyView/></Center> );
    case "SeedHardwareKeyView".toLocaleLowerCase(): return ( <Center><Preview_SeedHardwareKeyView/></Center> );
    case "SelectedDiceKeyView".toLocaleLowerCase(): return ( <Center><Preview_SelectedDiceKeyView /></Center> );
    case "DerivationView".toLocaleLowerCase(): return ( <PreviewView><Preview_DerivationView /></PreviewView>);
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
  ), document.getElementById("app-container"));
});

if (window.opener) {
  window.opener?.postMessage("ready", "*");
}
