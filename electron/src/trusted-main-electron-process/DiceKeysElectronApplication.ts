import { app, BrowserWindow, shell } from "electron";
//import { dialog } from "electron";
import * as IpcApiFactory from "./MainProcessApiFactory";
import { createBrowserWindow } from "../createBrowserWindow";
import { createMenu } from "../menu";
import {
  MainToRendererAsyncApi,
} from "./ElectronBridge";
import {
  deleteDiceKeyFromCredentialStore,
  getDiceKeyFromCredentialStore,
  storeDiceKeyInCredentialStore
 } from "./SecureDiceKeyStoreApi";
import {
  writeResultToStdOutAndExit
} from "./CommandLineApi";
import {
  AppLinkHandler
} from "./AppLinksApi";
import { saveUtf8File } from "./SaveAndLoad";

const openLinkInBrowser = async (url: string) => {
  await shell.openExternal(url);
}

export class DiceKeysElectronApplication {
  static #instance: DiceKeysElectronApplication | undefined;
  static get instance() { return this.#instance; }
  static createInstance = () => {
    this.#instance ??= new DiceKeysElectronApplication();
  };


  mainWindow: BrowserWindow | undefined;
  readonly rendererApi: MainToRendererAsyncApi;
  readonly appLinkHandler: AppLinkHandler;

  constructor() {
    this.mainWindow = createBrowserWindow();
    this.rendererApi = IpcApiFactory.implementMainToRendererAsyncClientInMainProcess(this.mainWindow.webContents);
    this.appLinkHandler = new AppLinkHandler(this.rendererApi.handleAppLink);

    IpcApiFactory.implementRendererToMainAsynchApiServerInMainProcess({
      deleteDiceKeyFromCredentialStore,
      getDiceKeyFromCredentialStore,
      storeDiceKeyInCredentialStore,
      saveUtf8File,
      openLinkInBrowser,
    });

    IpcApiFactory.implementRendererToMainSyncApiServerInMainProcess({
//      getAppLink: () => this.appLinkHandler?.getAppLink(),
      writeResultToStdOutAndExit,
      "openExternal": (url: string) => shell.openExternal(url),
    });

    createMenu(this.rendererApi);
    
    this.mainWindow.webContents.once('dom-ready', () => {
      this.appLinkHandler.processArgsForAppLink(process.argv);      
//      dialog.showErrorBox(`process.argv`, JSON.stringify(process.argv, undefined, 2));
    });

    app.on("second-instance", this.onSecondInstance);
    app.on("window-all-closed", this.onWindowsAllClosed);

    app.on('will-finish-launching', () => {
      // Protocol handler for osx
      app.on('open-url', (event, url) => {
        this.onOsXOpenUrl(event, url);
//        dialog.showErrorBox(`Received via open-url`, url);
      });
    });
  }

  onOsXOpenUrl(event: Electron.Event, url: string) {
    event.preventDefault();
    this.appLinkHandler.processArgsForAppLink([url]);
  }

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  onWindowsAllClosed = () => {
    // if (process.platform !== "darwin") {
    app.quit();
    // }
  };

  onSecondInstance = (_event: Electron.Event, commandLineArgV: string[]) => {
    if (this.mainWindow) {

      // Protocol handler for win32/linux
      // argv: An array of the second instance’s (command line / deep linked) arguments
      if (process.platform == 'win32' || process.platform == 'linux') {        
//        dialog.showErrorBox(`second instance argv`, JSON.stringify(commandLineArgV, undefined, 2));
        this.appLinkHandler.processArgsForAppLink(commandLineArgV);
      }

      if (this.mainWindow.isMinimized()) {
        this.mainWindow.restore();
      }
      this.mainWindow.focus();
    }
  };
}
