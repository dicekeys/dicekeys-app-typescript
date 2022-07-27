import {app} from 'electron';
import {squirrelCheck} from './electron-squirrel-startup';
/// import { LoadRecipesFnFactory, SaveRecipesFnFactory } from './SaveAndLoadRecipes';
import { DiceKeysElectronApplication } from './trusted-main-electron-process/DiceKeysElectronApplication';
import { aboutPanelOptions } from './trusted-main-electron-process/AboutPanelOptions';

// Disable the HID Block List so that FIDO devices can be enumerated
// and seeds can be written to them.
app.commandLine.appendSwitch('disable-hid-blocklist', "true");

if (DiceKeysElectronApplication == null) {
  // Forcing the use of the object ensures it loads.
  throw `Failed to load DiceKeysElectronApplication`;
}

app.setAboutPanelOptions(aboutPanelOptions);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (squirrelCheck()) {
  app.quit();
}

// Don't allow a second instance to open.
// Request a second instance lock, and if another process has that lock, it's the first
// instance and we should quit immediately.
if (!app.requestSingleInstanceLock()) {
  app.quit;
} else {
  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.

  app.whenReady().then(() => {
    app.setAsDefaultProtocolClient('dicekeys');
  });

  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require('electron-reloader')(module , {
        ignore : ['src', 'packaging', 'out'],
        debug: false
    });
    console.log(`In development mode. Making windows reloadable.`)
    // The try/catch is needed so it doesn't throw Cannot find module 'electron-reloader' in production.
  } catch {/**/}

  // app.on("activate", function () {
  //     // On macOS it's common to re-create a window in the app when the
  //     // dock icon is clicked and there are no other windows open.
  //     if (BrowserWindow.getAllWindows().length === 0) bootstrapApplication()
  // });

}