import { app, BrowserWindow } from "electron"
// import path from "path";

function createWindow () {
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      enableRemoteModule: true
      // preload: path.join(__dirname, 'preload.js'),
      // nodeIntegration: true
    }
  })

  win.loadFile('electron.html')
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
