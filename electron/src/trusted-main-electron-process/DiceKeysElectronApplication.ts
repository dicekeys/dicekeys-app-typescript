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
import { saveUtf8File } from "./SaveAndLoad";

const openLinkInBrowser = async (url: string) => {
  await shell.openExternal(url);
}

const findAppUrl = (commandLineArgs: string[]): URL | undefined => {
  const urlStringOrUndefined = commandLineArgs.find((value) =>
    value.indexOf("dicekeys:/") !== -1 && value.indexOf("command=") !== -1
  );
  if (urlStringOrUndefined == null) return;
  try {
    return new URL(urlStringOrUndefined);
  } catch {
    return;
  }
}

export class DiceKeysElectronApplication {
  static #instance: DiceKeysElectronApplication | undefined;
  static get instance() { return this.#instance; }
  static createInstance = () => {
    this.#instance ??= new DiceKeysElectronApplication();
  };


  mainWindow: BrowserWindow | undefined;
  readonly apiRequestWindows: BrowserWindow[] = [];
  readonly rendererApi: MainToRendererAsyncApi;

  constructor() {
    this.mainWindow = createBrowserWindow("electron.html", findAppUrl(process.argv)?.search);
    this.rendererApi = IpcApiFactory.implementMainToRendererAsyncClientInMainProcess(this.mainWindow.webContents);

    IpcApiFactory.implementRendererToMainAsyncApiServerInMainProcess({
      deleteDiceKeyFromCredentialStore,
      getDiceKeyFromCredentialStore,
      storeDiceKeyInCredentialStore,
      saveUtf8File,
      openLinkInBrowser,
    });

    IpcApiFactory.implementRendererToMainSyncApiServerInMainProcess({
      writeResultToStdOutAndExit,
      "openExternal": (url: string) => shell.openExternal(url),
    });

    createMenu(this.rendererApi);
    
    this.mainWindow.webContents.once('dom-ready', () => {
    });

    app.on("second-instance", this.onSecondInstance);
    app.on("window-all-closed", this.onWindowsAllClosed);

    // Protocol handler for osx
    app.on('open-url', (event, url) => {
      // console.log(`open-url`, event, url);
      this.onOsXOpenUrl(event, url);
    });
  }

  onOsXOpenUrl(event: Electron.Event, urlString: string) {
    event.preventDefault();
    const url = findAppUrl([urlString]);
    if (url != null) {
      createBrowserWindow("electron.html", url.search);
    }
    // this.appLinkHandler.processArgsForAppLink([urlString]);
  }

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  onWindowsAllClosed = () => {
    // if (process.platform !== "darwin") {
    app.quit();
    // }
  };

  focusMainWindow = () => {
    const {mainWindow} = this;
    if (!mainWindow) return; 
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.focus();
  }

  onSecondInstance = (_event: Electron.Event, commandLineArgV: string[]) => {
    // console.log(`onSecondInstance`, _event, commandLineArgV);
    // Protocol handler for win32/linux
    // argv: An array of the second instance’s (command line / deep linked) arguments
    if (process.platform == 'win32' || process.platform == 'linux') {        
    // dialog.showErrorBox(`second instance argv`, JSON.stringify(commandLineArgV, undefined, 2));
      const url = findAppUrl(commandLineArgV);
      if (url != null) {
        createBrowserWindow("electron.html", url.search);
      } else {
        this.focusMainWindow();
      }
    //this.appLinkHandler.processArgsForAppLink(commandLineArgV);
    } else {
      this.focusMainWindow();
    }
  };
}
