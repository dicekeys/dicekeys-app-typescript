import * as IpcApiFactory from "./IpcApiFactory";
import {app} from "electron";
import type {RemoveListener} from "../../../common/IElectronBridge";

let appLinkUrl: string
const callbacks: ((applink: string) => any)[] = []

export function registerAppLinkProtocol(){
    app.setAsDefaultProtocolClient('dicekeys')
}

export function processArgsForAppLink(args: string[]){
    const url = args.find((value) => {
        return value.indexOf("dicekeys://") !== -1 && value.indexOf("command=") !== -1
    })

    if(url){
        sendAppLink(url)
    }
}

export function sendAppLink(url: string){
    appLinkUrl = url
    callbacks.forEach((callback) => {
        callback(appLinkUrl)
    })
}

IpcApiFactory.implementSyncApi( "getAppLink", () => {
    return appLinkUrl
});
IpcApiFactory.implementListenerApi("listenForAppLinks", (callback : (applink: string) => any, _ ?: (error: any) => any) : RemoveListener => {
    if(appLinkUrl){
        callback(appLinkUrl)
    }
    callbacks.push(callback)
    return () => {
        callbacks.splice(callbacks.indexOf(callback), 1)
    };
});
