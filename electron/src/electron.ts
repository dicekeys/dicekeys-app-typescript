import {app, BrowserWindow, ipcMain} from 'electron';
import * as path from 'path';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// This is crashing in macOS
// if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
//   app.quit();
// }

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
      preload: path.resolve(__dirname, "..", "dist" , "preload.js")
    },
    width: 800,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.resolve(__dirname, '..' ,'app', 'electron.html'));

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
  process.stdout.write(result + '\n');
  process.exit(0)
})
