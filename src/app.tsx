import ReactDOM from "react-dom";
import * as React from "react";
import {AppTopLevelRoutingView} from "./web-components/AppTopLevelRoutingView";

window.addEventListener('load', () => {
  ReactDOM.render(<AppTopLevelRoutingView />, document.getElementById("app-container"));
});