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
    },
    openFileDialog: (options: Electron.OpenDialogOptions, code: string) => {
        return new Promise<Electron.OpenDialogReturnValue>(function(resolve, reject){
            ipcRenderer.on('open-file-dialog-response' , function listener(event, value, eventCode){
                if(code === eventCode){
                    resolve(value)
                    ipcRenderer.removeListener('open-file-dialog-response', listener)
                }
            });

            ipcRenderer.send('open-file-dialog', options, code)
        });
    },
    openMessageDialog: (options: Electron.MessageBoxOptions, code: string) => {
        return new Promise<Electron.MessageBoxReturnValue>(function(resolve, reject){
            ipcRenderer.on('open-message-dialog-response' , function listener(event, value, eventCode){
                if(code === eventCode){
                    resolve(value)
                    ipcRenderer.removeListener('open-message-dialog-response', listener)
                }
            });

            ipcRenderer.send('open-message-dialog', options, code)
        });
    }

} as IElectronBridge)
