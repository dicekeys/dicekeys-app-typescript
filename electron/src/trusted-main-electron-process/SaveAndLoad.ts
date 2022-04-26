import {dialog, SaveDialogOptions, app} from "electron";
import { readFile, writeFile } from "fs";
import path from "path";
import { RendererToMainAsyncApi } from "./ElectronBridge";

const jsonFilters: Electron.FileFilter[] = [
  { name: 'JSON', extensions: ['json'] },
];

const commonJsonOptions: Electron.SaveDialogOptions & Electron.OpenDialogOptions = {
  filters: jsonFilters
};
const defaultSaveJsonOptions: Electron.SaveDialogOptions = {
  ...commonJsonOptions
};
const defaultOpenJsonOptions: Electron.OpenDialogOptions = {...commonJsonOptions};

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
    ...defaultSaveJsonOptions,
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
    ...defaultOpenJsonOptions,
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

export const saveUtf8File: RendererToMainAsyncApi["saveUtf8File"] = async ({
  content,
  requiredExtension,
  fileName
}): Promise<boolean> => {
  const {canceled, filePath} = await dialog.showSaveDialog({
    defaultPath: path.join(getDefaultDirectoryPath(),`${fileName}`),
    ...(requiredExtension == null ? {} : {filters: [{name: requiredExtension, extensions: [requiredExtension]}]}),
  });
  if (canceled || filePath == null) {
    return false;
  }
  await new Promise<void>( (resolve, reject) =>
    writeFile(filePath, content, {encoding: "utf-8"}, (err) =>
      err != null ? reject(err) : resolve()
    )
  );
  return true;
}