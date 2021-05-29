// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
import { IElectronBridge } from "./IElectronBridge";
import {contextBridge, ipcRenderer} from "electron";

contextBridge.exposeInMainWorld('ElectronBridge', {
    // Return result in stdout and quit
    cliResult: (result: string) => {
        ipcRenderer.send("cli-result", result)
    },
    // Get cli args
    cliArgs: () => {
        return ipcRenderer.sendSync('cli-args')
    }
} as IElectronBridge)
