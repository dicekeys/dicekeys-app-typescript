// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { IElectronBridge } from "./IElectronBridge";
import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('ElectronBridge', {
    cliResult: (result: string) => {
        ipcRenderer.send("cli-result", result)
    }
} as IElectronBridge)
