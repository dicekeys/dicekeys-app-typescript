import * as IpcApiFactory from "./IpcApiFactory";
import {app, BrowserWindow} from "electron";
import type {RemoveListener} from "../../../common/IElectronBridge";
import * as ElectronBridge from "./ElectronBridge";

let appLinkUrl: string

export function registerAppLinkProtocol(){
    app.setAsDefaultProtocolClient('dicekeys')

    // Protocol handler for win32
    if (process.platform == 'win32') {
        // Keep only command line / deep linked arguments
        appLinkUrl = process.argv[1]
    }
}

export function sendAppLink(appLink: string, window: BrowserWindow){
    appLinkUrl = appLink
    if (window && window.webContents) {
        const channelName = ElectronBridge.responseChannelNameFor("listenForAppLinks");
        window.webContents.send(channelName, appLinkUrl)
    }
}

IpcApiFactory.implementSyncApi( "getAppLink", () => {
    return appLinkUrl
});
IpcApiFactory.implementListenerApi("listenForAppLinks", (callback : (applink: string) => any, _ ?: (error: any) => any) : RemoveListener => {
    if(appLinkUrl){
        callback(appLinkUrl)
    }
    return () => {};
});
