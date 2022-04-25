import {dialog, SaveDialogOptions, app} from "electron";
import { readFile, writeFile } from "fs";
import path from "path";

const filters: Electron.FileFilter[] = [
  { name: 'JSON', extensions: ['json'] },
];

const commonOptions: Electron.SaveDialogOptions & Electron.OpenDialogOptions = {
  filters
};
const defaultSaveOptions: Electron.SaveDialogOptions = {
  ...commonOptions
};
const defaultOpenOptions: Electron.OpenDialogOptions = {...commonOptions};

const getDefaultDirectoryPath = () => app.getPath("documents");

const getDefaultFileName = (now: Date = new Date()) => path.join(getDefaultDirectoryPath(),
  `DiceKeys-Recipes-Exported-${
      now.getFullYear()
    }-${
      (now.getMonth() + 1).toString().padStart(2, "0")
    }-${
      (now.getDate()).toString().padStart(2, "0")
    }.json`);

export const exportRecipesToFile = async (
  recipesJson: string,
  saveOptions: SaveDialogOptions = {}
): Promise<boolean> => {
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: getDefaultFileName(),
    ...defaultSaveOptions,
    ...saveOptions,
  });
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

export const getRecipesToImportFromFile = async (
  openOptions: Electron.OpenDialogOptions = {}
): Promise<string | undefined> => {
  const {canceled, filePaths} = await dialog.showOpenDialog({
    defaultPath: getDefaultDirectoryPath(),
    ...defaultOpenOptions,
    ...openOptions
  });
  if (canceled || filePaths.length !== 1) {
    return;
  }
  return await new Promise<string>( (resolve, reject) =>
    readFile(filePaths[0], {encoding: "utf-8", flag: "r"}, (err, json) =>
      err != null ? reject(err) : resolve(json)
    )
  );
}
