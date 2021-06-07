import {
  app, 
  BrowserWindow,
} from 'electron';
import * as path from 'path';

export const createBrowserWindow = () => {
  // Create the browser window.
  const window = new BrowserWindow({
    height: 600,
    webPreferences: {
      spellcheck: false,
      preload: path.resolve(__dirname, "..", "src", "preload.js")
    },
    width: 800,
  });

  // and load the index.html of the app.
  window.loadFile(path.resolve(__dirname, '..', '..', 'app', 'electron.html'));

  if(!app.isPackaged){
    // Open the DevTools.
    window.webContents.openDevTools();
  }

  return window;
}
