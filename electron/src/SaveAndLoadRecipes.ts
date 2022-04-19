import {dialog} from "electron";
import { readFile, writeFile } from "fs";

const filters: Electron.FileFilter[] = [
  { name: 'JSON', extensions: ['json'] },
];
const commonOptions: Electron.SaveDialogOptions & Electron.OpenDialogOptions = {
  filters
};
const saveOptions: Electron.SaveDialogOptions = {...commonOptions};
const openOptions: Electron.OpenDialogOptions = {...commonOptions};


export const saveRecipes = async (recipesJson: string): Promise<boolean> => {
  const {canceled, filePath} = await dialog.showSaveDialog(saveOptions);
  if (canceled || filePath == null) {
    return false;
  }
  await new Promise<void>( (resolve, reject) =>
    writeFile(filePath, recipesJson, {encoding: "utf-8"}, (err) =>
      err != null ? reject(err) : resolve()
    )
  );
  return true;
}

export const loadRecipes = async (): Promise<string | undefined> => {
  const {canceled, filePaths} = await dialog.showOpenDialog(openOptions);
  if (canceled || filePaths.length !== 1) {
    return;
  }
  return await new Promise<string>( (resolve, reject) =>
    readFile(filePaths[0], {encoding: "utf-8", flag: "r"}, (err, json) =>
      err != null ? reject(err) : resolve(json)
    )
  );
}

export const SaveRecipesFnFactory = (window: Electron.BrowserWindow) => async (recipesJson: string): Promise<boolean> => {
  const {canceled, filePath} = await dialog.showSaveDialog(window, {});
  if (canceled || filePath == null) {
    return false;
  }
  try {
    await new Promise<void>( (resolve, reject) =>
      writeFile(filePath, recipesJson, {encoding: "utf-8"}, (err) =>
        err != null ? reject(err) : resolve()
      )
    );
  } catch (exception) {
    throw(exception);
//    return false;
  }
  return true;
}

export const LoadRecipesFnFactory = (window: Electron.BrowserWindow) => async (): Promise<string | undefined> => {
  const {canceled, filePaths} = await dialog.showOpenDialog(window, {});
  if (canceled || filePaths.length !== 1) {
    return;
  }
  try {
    return await new Promise<string>( (resolve, reject) =>
      readFile(filePaths[0], {encoding: "utf-8", flag: "r"}, (err, json) =>
        err != null ? reject(err) : resolve(json)
      )
    );
  } catch (err) {
    // return;
    throw (err as NodeJS.ErrnoException);
  }
}
