import {app, BrowserWindow, dialog, ipcMain} from 'electron';
import * as path from 'path';

import * as squirrelCheck from './electron-squirrel-startup'
import ipcRenderer = Electron.Renderer.ipcRenderer;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelCheck()) {
    app.quit();
}

const cliArgs = process.argv.slice(2);

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

// Return value and exit
ipcMain.on("cli-result", (event, result) => {
    process.stdout.write(result);
    process.stdout.write('\n');
    process.exit(0)
})

// Return cli arguments
ipcMain.on('cli-args', (event, arg) => {
    event.returnValue = cliArgs
})

ipcMain.on('open-file-dialog', (event, options, code) => {
    dialog.showOpenDialog(mainWindow, options).then((value) => {
        event.sender.send('open-file-dialog-response', value, code);
    })
});

ipcMain.on('open-message-dialog', (event, options, code) => {
    dialog.showMessageBox(options).then((value) => {
        event.sender.send('open-message-dialog-response', value, code)
    });
});
