// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import {contextBridge} from "electron";
import type {
  ElectronBridgeRendererView,
} from "./trusted-main-electron-process/ElectronBridge";
import {
  electronBridgeConstants,
} from "./trusted-main-electron-process/ElectronBridgeConstants";
import {
  implementMainToRendererAsyncApiServerInRendererProcess,
  rendererToMainAsyncApi,
  rendererToMainSyncApi,
} from "./trusted-main-electron-process/RendererProcessApiFactory"
  
  // Create the API to expose, using TypeScript to verify that we created everything correctly
const electronBridgeTypeChecked: ElectronBridgeRendererView = {
  ...electronBridgeConstants,
  ...rendererToMainAsyncApi,
  ...rendererToMainSyncApi,
  implementMainToRendererAsyncApi: implementMainToRendererAsyncApiServerInRendererProcess,
};

// Expose the API
contextBridge.exposeInMainWorld('ElectronBridge', electronBridgeTypeChecked);
