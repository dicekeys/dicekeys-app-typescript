// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { IElectronBridge } from "./IElectronBridge";
import {contextBridge, ipcRenderer} from "electron";
import {
  ElectronIpcAsyncRequestChannelName,
  ElectronIpcSyncRequestChannelName,
  ElectronBridgeAsyncApiRequest,
  ElectronBridgeSyncApiRequest,
  ElectronBridgeAsyncApiResponse,
  ElectronBridgeSyncApiResponse,
  exceptionCodeFor,
  responseChannelNameFor,
} from "./IElectronBridge";

const createIpcSyncRequestClientFunction = <CHANNEL extends ElectronIpcSyncRequestChannelName>(channel: CHANNEL) =>
  (...args: ElectronBridgeSyncApiRequest<CHANNEL>) => ipcRenderer.sendSync(channel, ...args) as ElectronBridgeSyncApiResponse<CHANNEL>

const createIpcAsyncRequestClientFunction = <CHANNEL extends ElectronIpcAsyncRequestChannelName>(channel: CHANNEL) =>
  (...args: ElectronBridgeAsyncApiRequest<CHANNEL>) =>
  new Promise<ElectronBridgeAsyncApiResponse<CHANNEL>>( (resolve, reject) => {
    // Create a code that allows us to match requests to responses
    const codeToMatch = `${Math.random()}:${Math.random()}`;
    // The response channel name is the name of the request channel type with suffix "-response" added
    const responseChannel = responseChannelNameFor(channel)
    // Create a listener function that will resolve the promise and stop listening when
    // the event code matches
    const responseListener = (event: Electron.IpcRendererEvent, eventCode: string, response: ElectronBridgeAsyncApiResponse<CHANNEL>) => {
      if (eventCode === exceptionCodeFor(codeToMatch) ) {
        // The value is actually an exception and we should reject the promise.
        reject(response);
        ipcRenderer.removeListener(responseChannel, responseListener);
      } else if (eventCode === codeToMatch) {
        // The response code matches the request and so we should resolve the request
        resolve(response)
        ipcRenderer.removeListener(responseChannel, responseListener);
      }
    }
    // Start listening for response just before sending the request
    ipcRenderer.on(responseChannel, responseListener);
    // Send the request
    ipcRenderer.send(channel, codeToMatch, ...args);
  });


// Create the API to expose, using TypeScript to verify that we created everything correctly
const electronBridgeTypeChecked: IElectronBridge = {
  writeResultToStdOutAndExit: createIpcSyncRequestClientFunction("writeResultToStdOutAndExit"),
  getCommandLineArguments: createIpcSyncRequestClientFunction("getCommandLineArguments"),
  openFileDialog: createIpcAsyncRequestClientFunction("openFileDialog"),
  openMessageDialog: createIpcAsyncRequestClientFunction("openMessageDialog"),
  getDeepLink: createIpcSyncRequestClientFunction("getDeepLink"),
  setDeepLinkListener: (fn: (deepLink: string[]) => void) => {
      ipcRenderer.on('deeplink', (event,args: string[]) => fn(args));
  },
};

// Expose the API
contextBridge.exposeInMainWorld('ElectronBridge', electronBridgeTypeChecked);
