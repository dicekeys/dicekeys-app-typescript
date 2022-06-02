import {
  app, 
  BrowserWindow,
} from 'electron';
import * as path from 'path';


export const FiltersForUsbDeviceASeedableFIDOKey: HIDDeviceFilter[] = [
  {vendorId: 0x10c4, productId: 0x8acf},
  {vendorId: 0x0483, productId: 0xa2ca},
];  

export const createBrowserWindow = (htmlFileName: "electron.html" = "electron.html", query?: string) => {
  // Create the browser window.
  const window = new BrowserWindow({
    height: 600,
    webPreferences: {
      spellcheck: false,
      preload: path.resolve(__dirname, "..", "electron-js", "preload.js")
    },
    width: 800,
  });

  window.webContents.session.setPermissionCheckHandler((_webContents, permission, requestingOrigin, _details) => {
    const codeIsFromFileSystem = requestingOrigin.startsWith("file://");
//    console.log(`Request for permission ${permission} from ${requestingOrigin}`)
    switch (permission) {
      case "clipboard-sanitized-write":
        // undocumented permission needed to allow clipboard writes via our button
        return codeIsFromFileSystem;
      case "media":
        return codeIsFromFileSystem;
      // Allow access to WebHID so we can interact with seedable FIDO keys
      case "hid":
        return codeIsFromFileSystem;
      // Deny other access
      case "serial":
      default:
        return false;
    }
  });

  window.webContents.session.setDevicePermissionHandler((details) => {
    // Deny requests that are from web content (outside the file system)
    if (details.origin.startsWith("file://") && details.deviceType === 'hid') {
      return FiltersForUsbDeviceASeedableFIDOKey.some(
        filter =>
          filter.productId === details.device.productId &&
          filter.vendorId === details.device.vendorId
      );
    }
    return false;
  })

  // and load the index.html of the app.
  const htmlPath =  path.resolve(app.getAppPath(), 'electron-html', htmlFileName);
  const pathToLoad = `file://${htmlPath}${query ?? ""}`;
  // console.log("Loading window with path", pathToLoad);
  window.loadURL(pathToLoad);

  if (!app.isPackaged){
    // Open the DevTools.
    window.webContents.openDevTools();
  }

  return window;
}
