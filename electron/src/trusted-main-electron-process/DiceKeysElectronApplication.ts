import { app, shell } from "electron";
//import { dialog } from "electron";
import {
  implementRendererToMainSyncApiServerInMainProcess,
  implementRendererToMainAsyncApiServerInMainProcess,
  mainToRendererAsyncClient,
} from "./MainProcessApiFactory";
import { BrowserWindows } from "./BrowserWindows";
import { createMenu } from "../menu";
import {
  deleteDiceKeyFromCredentialStore,
  getDiceKeyFromCredentialStore,
  storeDiceKeyInCredentialStore
 } from "./SecureDiceKeyStoreApi";
import {
  writeResultToStdOutAndExit
} from "./CommandLineApi";
import { saveUtf8File } from "./SaveAndLoad";
import { DiceKeyMemoryStoreStorageFormat } from "../../../common/IElectronBridge";
import { SynchronizedStringState } from "./SynchronizedStringState";

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

  storedDiceKeys: DiceKeyMemoryStoreStorageFormat = {keyIdToDiceKeyInHumanReadableForm: []};

  getDiceKeyMemoryStore = () => this.storedDiceKeys;
  broadcastUpdateToDiceKeyMemoryStore = (storedDiceKeys: DiceKeyMemoryStoreStorageFormat) => {
    // Send this message to all renderer processes.
    this.storedDiceKeys = storedDiceKeys;
  }

  constructor() {
    BrowserWindows.mainWindow = BrowserWindows.createBrowserWindow("electron.html", findAppUrl(process.argv)?.search);

    implementRendererToMainAsyncApiServerInMainProcess({
      deleteDiceKeyFromCredentialStore,
      getDiceKeyFromCredentialStore,
      storeDiceKeyInCredentialStore,
      saveUtf8File,
      openLinkInBrowser,
    });

    implementRendererToMainSyncApiServerInMainProcess({
      writeResultToStdOutAndExit,
      "openExternal": (url: string) => shell.openExternal(url),
      "setSynchronizedStringState": SynchronizedStringState.setSynchronizedStringForKey,
      "getSynchronizedStringState": SynchronizedStringState.getSynchronizedStringForKey,
    });

    createMenu(mainToRendererAsyncClient);

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
      BrowserWindows.createBrowserWindow("electron.html", url.search);
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
    const {mainWindow} = BrowserWindows;
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
        BrowserWindows.createBrowserWindow("electron.html", url.search);
      } else {
        this.focusMainWindow();
      }
    //this.appLinkHandler.processArgsForAppLink(commandLineArgV);
    } else {
      this.focusMainWindow();
    }
  };
}
