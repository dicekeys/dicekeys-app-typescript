import {app, Menu} from 'electron';
import { exportRecipesToFile, getRecipesToImportFromFile } from "./trusted-main-electron-process/SaveAndLoad";
import { MainToPrimaryRendererAsyncApi } from "./trusted-main-electron-process/ElectronBridge";
const isMac = process.platform === "darwin";

export const createMenu = (MainToPrimaryRendererAsyncApi: MainToPrimaryRendererAsyncApi) => {

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

  const importRecipes = async () => {
    const recipesJson = await getRecipesToImportFromFile();
    if (typeof recipesJson === "string") {
      MainToPrimaryRendererAsyncApi.importRecipes(recipesJson);
    }
    // console.log(`Import recipes`); //, recipes);
  }

  const exportRecipes = async () => {
    const recipesJson = await MainToPrimaryRendererAsyncApi.getRecipesToExport();
    const wasExported = await exportRecipesToFile(recipesJson);
    // console.log(`Export recipes`, recipesJson, wasExported);
    return wasExported;
  }

  const FileMenuItems: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Recover DiceKey from shares',
      click: () => MainToPrimaryRendererAsyncApi.loadFromShares(),
    },
    {
      label: 'Load random DiceKey',
      click: () => MainToPrimaryRendererAsyncApi.loadRandomDiceKey(),
    },
    { type: 'separator' },
    {
      label: 'Import recipes',
      click: importRecipes,
    },
    {
      label: 'Export recipes',
      click: exportRecipes,
    },
    { type: 'separator' },

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

  // const RecipeMenuItems: Electron.MenuItemConstructorOptions[] = [
  //   {
  //     label: 'Learn More',
  //     click: async () => {
  //       const { shell } = require('electron')
  //       await shell.openExternal('https://dicekeys.com')
  //     }
  // ];
  // const RecipeMenu: Electron.MenuItemConstructorOptions = {label: "Recipes", submenu: RecipeMenuItems};



  const HelpMenuItems: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Learn More',
      click: async () => {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
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

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}