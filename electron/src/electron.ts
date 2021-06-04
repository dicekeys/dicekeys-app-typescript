import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import * as path from 'path';

import * as squirrelCheck from './electron-squirrel-startup'
import {
  ElectronIpcAsyncRequestChannelName,
  ElectronBridgeAsyncApiRequest,
  ElectronBridgeAsyncApiResponse,
  exceptionCodeFor,
  responseChannelNameFor,
  ElectronIpcSyncRequestChannelName,
  ElectronBridgeSyncApiResponse,
  ElectronBridgeSyncApiRequest,
  ElectronBridgeListener,
  ElectronIpcListenerRequestChannelName,
  RemoveListener,
  ElectronBridgeListenerApiCallbackParameters,
  ElectronBridgeListenerApiSetupArgs,
  ElectronBridgeListenerApiErrorCallbackParameters,
  terminateChannelNameFor,
} from '../../web/src/IElectronBridge';
import { monitorForFidoDevicesConnectedViaUsb } from './SeedableHardwareKeys';
import ipcRenderer = Electron.Renderer.ipcRenderer;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelCheck()) {
    app.quit();
}

let mainWindow: BrowserWindow

function bootstrapApplication() {
    // Bootstrap if needed
    startApplication()
}

function startApplication() {
    // Create the browser window.
    mainWindow = new BrowserWindow({
        height: 600,
        webPreferences: {
            preload: path.resolve(__dirname, "..", "dist", "preload.js")
        },
        width: 800,
    });

    // and load the index.html of the app.
    mainWindow.loadFile(path.resolve(__dirname, '..', 'app', 'electron.html'));

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
}

const instanceLock = app.requestSingleInstanceLock()

if (instanceLock) {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        // Someone tried to run a second instance, we should focus our window.
        if (mainWindow) {
            if (mainWindow.isMinimized()) {
                mainWindow.restore()
            }
            mainWindow.focus()
        }
    })

    // This method will be called when Electron has finished
    // initialization and is ready to create browser windows.
    // Some APIs can only be used after this event occurs.
    app.whenReady().then(() => {
        bootstrapApplication()
    })

    app.on("activate", function () {
        // On macOS it's common to re-create a window in the app when the
        // dock icon is clicked and there are no other windows open.
        if (BrowserWindow.getAllWindows().length === 0) startApplication()
    });

    // Quit when all windows are closed, except on macOS. There, it's common
    // for applications and their menu bar to stay active until the user quits
    // explicitly with Cmd + Q.
    app.on("window-all-closed", () => {
        // if (process.platform !== "darwin") {
        app.quit();
        // }
    });
} else {
    app.quit()
}


const implementSyncApi = <CHANNEL extends ElectronIpcSyncRequestChannelName>(channel: CHANNEL, implementation: (...args: ElectronBridgeSyncApiRequest<CHANNEL>) => ElectronBridgeSyncApiResponse<CHANNEL>) => {
  const responseChannelName = responseChannelNameFor(channel);
  ipcMain.on(channel, (event, ...args) => {
    try {
      event.returnValue = implementation(...(args as ElectronBridgeSyncApiRequest<CHANNEL>));
    } catch (e) {
      event.returnValue = e;
    }
  })
}
const implementAsyncApi = <CHANNEL extends ElectronIpcAsyncRequestChannelName>(channel: CHANNEL, implementation: (...args: ElectronBridgeAsyncApiRequest<CHANNEL>) => Promise<ElectronBridgeAsyncApiResponse<CHANNEL>>) => {
  const responseChannelName = responseChannelNameFor(channel);
  ipcMain.on(channel, (event, code, ...args) => {
    implementation(...args as ElectronBridgeAsyncApiRequest<CHANNEL>).then( response =>
      event.sender.send(responseChannelName, code, response)
    ).catch( exception =>
      event.sender.send(responseChannelName, exceptionCodeFor(code), exception)
    )
  })
}

const implementListenerApi = <CHANNEL extends ElectronIpcListenerRequestChannelName>(channel: CHANNEL,
    implementation: ElectronBridgeListener<CHANNEL>
  ) => {
  const responseChannelName = responseChannelNameFor(channel);
  const listenerCodeToRemovalFunction = new Map<string, RemoveListener>();
  ipcMain.on(terminateChannelNameFor(channel), (event, code) => {
    // Run the termination function
    listenerCodeToRemovalFunction.get(code)?.();
  })
  ipcMain.on(channel, (event, code, ...setupArgs: ElectronBridgeListenerApiSetupArgs<CHANNEL>) => {
    const removeListener = implementation(
      (...callbackArgs: ElectronBridgeListenerApiCallbackParameters<CHANNEL>) => {
        event.sender.send(responseChannelName, code, ...callbackArgs)
      },
      (...errorCallbackArgs: ElectronBridgeListenerApiErrorCallbackParameters<CHANNEL>) => {
        event.sender.send( responseChannelName, exceptionCodeFor(code), ...errorCallbackArgs)
      },
      ...(setupArgs as []) // FIXME to make typescript happy
    )
    listenerCodeToRemovalFunction.set(code, removeListener)
  })
}

implementSyncApi( "writeResultToStdOutAndExit", (result) => {
  process.stdout.write(result);
  process.stdout.write('\n');
  process.exit(0)
});
implementSyncApi( "getCommandLineArguments", () => {
  /**
    When executed with electron command the first two arguments are the path and the executable name,
    so the actual command line arguments start at index 2. When executed as packed binary the actual
    command line arguments start at index 1.
    See: https://nodejs.org/docs/latest/api/process.html#process_process_argv.
    The constant represents only the arguments that follow the path and executable name.
  */
  const argv = process.argv
  if(argv[0].toLowerCase().endsWith("electron")){
      return argv.slice(2)
  }else{
      return argv.slice(1)
  }
});
implementAsyncApi( "openFileDialog", (options) => dialog.showOpenDialog(mainWindow, options) );
implementAsyncApi( "openMessageDialog", (options) => dialog.showMessageBox(mainWindow, options) );
implementListenerApi("listenForSeedableSecurityKeys", monitorForFidoDevicesConnectedViaUsb );