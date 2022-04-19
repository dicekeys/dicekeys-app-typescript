import {app, Menu} from 'electron';
const isMac = process.platform === "darwin";

const AppNameSubMenuItems: Electron.MenuItemConstructorOptions[] = [
  { role: 'about' },
  { type: 'separator' },
  { role: 'services' },
  { type: 'separator' },
  { role: 'hide' },
  { role: 'hideOthers' },
  { role: 'unhide' },
  { type: 'separator' },
  { role: 'quit' }
];

const AppNameSubMenu: Electron.MenuItemConstructorOptions = {
  label: app.name, submenu: AppNameSubMenuItems
};

const FileMenuItems: Electron.MenuItemConstructorOptions[] = [
  // {label: "import recipes", click: () => { electronBridge.

  // }}
  { role: isMac ? 'close' : 'quit' }
];
const FileMenu: Electron.MenuItemConstructorOptions = {label: "File", submenu: FileMenuItems};

const EditMenuItems: Electron.MenuItemConstructorOptions[] = [
  // { role: 'undo' },
  // { role: 'redo' },
  // { type: 'separator' },
  { role: 'cut' },
  { role: 'copy' },
  { role: 'paste' },
  // ...(isMac ? [
  //   { role: 'pasteAndMatchStyle' },
  //   { role: 'delete' },
  //   { role: 'selectAll' },
  //   { type: 'separator' },
    // {
    //   label: 'Speech',
    //   submenu: [
    //     { role: 'startSpeaking' },
    //     { role: 'stopSpeaking' }
    //   ]
    // }
  // ] : [
  //   { role: 'delete' },
  //   { type: 'separator' },
  //   { role: 'selectAll' }
  // ])
];
const EditMenu: Electron.MenuItemConstructorOptions = {label: "Edit", submenu: EditMenuItems};

// const ViewMenuItems: Electron.MenuItemConstructorOptions[] = [
//   { role: 'reload' },
//   { role: 'forceReload' },
//   { role: 'toggleDevTools' },
//   { type: 'separator' },
//   { role: 'resetZoom' },
//   { role: 'zoomIn' },
//   { role: 'zoomOut' },
//   { type: 'separator' },
//   { role: 'togglefullscreen' }
// ];
// const ViewMenu = {label: "View", submenu: XXXMenuItems};

const WindowMenuItems: Electron.MenuItemConstructorOptions[] = [
  { role: 'minimize' },
  // { role: 'zoom' },
  ...((isMac ? ([
    { type: 'separator' },
    { role: 'front' },
    { type: 'separator' },
    { role: 'window' }
  ]) : ([
    { role: 'close' }
  ])) as Electron.MenuItemConstructorOptions[])
];
const WindowMenu: Electron.MenuItemConstructorOptions = {label: "Window", submenu: WindowMenuItems};

const HelpMenuItems: Electron.MenuItemConstructorOptions[] = [
  {
    label: 'Learn More',
    click: async () => {
      const { shell } = require('electron')
      await shell.openExternal('https://dicekeys.com')
    }
  }
];
const HelpMenu: Electron.MenuItemConstructorOptions = {role: "help", submenu: HelpMenuItems};

const menuTemplate:  Electron.MenuItemConstructorOptions[] = [
  // { role: 'appMenu' }
  ...(isMac ? [AppNameSubMenu] : []),
  FileMenu,
  EditMenu,
  WindowMenu,
  HelpMenu
];

export const createMenu = () => {
  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}