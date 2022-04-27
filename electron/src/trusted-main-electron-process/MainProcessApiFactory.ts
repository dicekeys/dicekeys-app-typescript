import {ipcMain, WebContents} from 'electron';
import * as ElectronBridge from "./ElectronBridge";
import {
  implementIpcSyncApiServerFn,
  implementIpcAsyncApiServerFn,
  implementIpcAsyncApiClientFn,
} from "./IpcApiFactory"

const pretendWeHaveUsedInputToMakeTypeScriptHappy = <T extends unknown[]>(..._args: T) => {}

const MainToRendererAsyncApiFunctionNames = [
  "getRecipesToExport",
  "handleAppLink",
  "importRecipes",
  "loadRandomDiceKey",
] as const;
type MainToRendererAsyncApiFunctionName = (typeof MainToRendererAsyncApiFunctionNames)[number];
// Ensure we've enumerated all function names
const _testOfRendererToMainAsyncFunctionNamesIncludesAll_: MainToRendererAsyncApiFunctionName = "" as (keyof ElectronBridge.MainToRendererAsyncApi);
// Ensure we've only written valid function names
const _testOfRendererToMainAsyncFunctionNamesAllValid_: keyof ElectronBridge.MainToRendererAsyncApi = "" as MainToRendererAsyncApiFunctionName;
pretendWeHaveUsedInputToMakeTypeScriptHappy(_testOfRendererToMainAsyncFunctionNamesAllValid_, _testOfRendererToMainAsyncFunctionNamesIncludesAll_);


const implementRendererToMainSyncFnInMainProcess = implementIpcSyncApiServerFn(ipcMain);
const implementRendererToMainAsyncFnInMainProcess = implementIpcAsyncApiServerFn(ipcMain);

export const implementRendererToMainAsynchApiServerInMainProcess = (implementation: ElectronBridge.RendererToMainAsyncApi) => {
  (Object.keys(implementation) as (keyof ElectronBridge.RendererToMainAsyncApi)[])
    .forEach( (fnName) => implementRendererToMainAsyncFnInMainProcess(fnName, implementation[fnName]) );
  }

export const implementRendererToMainSyncApiServerInMainProcess = (implementation: ElectronBridge.RendererToMainSyncApi) => {
  (Object.keys(implementation) as (keyof ElectronBridge.RendererToMainSyncApi)[])
    .forEach( (fnName) => implementRendererToMainSyncFnInMainProcess(fnName, implementation[fnName]) );
  }

// const implementMainToRendererAsyncClientFuntionInMainProcess = (webContents: WebContents) =>
//   implementIpcAsyncApiClietFn(webContents, ipcMain);

export const implementMainToRendererAsyncClientInMainProcess = (webContents: WebContents) => {
  const implementClientFunction = implementIpcAsyncApiClientFn(webContents, ipcMain);
  return MainToRendererAsyncApiFunctionNames.reduce( <FN_NAME extends keyof ElectronBridge.MainToRendererAsyncApi>(
    api: Partial<ElectronBridge.MainToRendererAsyncApi>, fnName: FN_NAME) => {
    api[fnName] = implementClientFunction(fnName);
    return api;
  }, {} as Partial<ElectronBridge.MainToRendererAsyncApi> ) as ElectronBridge.MainToRendererAsyncApi;
}
  

