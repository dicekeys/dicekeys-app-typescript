import {ipcMain} from 'electron';
import * as ElectronBridge from "./ElectronBridge";
import {
  implementIpcSyncApiServerFn,
  implementIpcAsyncApiServerFn,
  implementIpcAsyncApiClientFnInMain,
  implementIpcSendBroadcastFromElectronToAllRenderersFn,
} from "./IpcApiFactory"

const pretendWeHaveUsedInputToMakeTypeScriptHappy = <T extends any[]>(..._args: T) => {}

const MainToPrimaryRendererAsyncApiFunctionNames = [
  "getRecipesToExport",
  "importRecipes",
  "loadRandomDiceKey",
] as const;
type MainToPrimaryRendererAsyncApiFunctionName = (typeof MainToPrimaryRendererAsyncApiFunctionNames)[number];
// Ensure we've enumerated all function names
const _testOfRendererToMainAsyncFunctionNamesIncludesAll_: MainToPrimaryRendererAsyncApiFunctionName = "" as (keyof ElectronBridge.MainToPrimaryRendererAsyncApi);
// Ensure we've only written valid function names
const _testOfRendererToMainAsyncFunctionNamesAllValid_: keyof ElectronBridge.MainToPrimaryRendererAsyncApi = "" as MainToPrimaryRendererAsyncApiFunctionName;
pretendWeHaveUsedInputToMakeTypeScriptHappy(_testOfRendererToMainAsyncFunctionNamesAllValid_, _testOfRendererToMainAsyncFunctionNamesIncludesAll_);

const MainToAllRenderersApiFunctionNames = [
  "broadcastUpdatedSynchronizedStringState",
] as const;
type MainToAllRenderersApiFunctionName = (typeof MainToAllRenderersApiFunctionNames)[number];
// Ensure we've enumerated all function names
const _testOfMainToAllRenderersFunctionNamesIncludesAll_: MainToAllRenderersApiFunctionName = "" as (keyof ElectronBridge.MainToAllRenderersApi);
// Ensure we've only written valid function names
const _testOfMainToAllRenderersFunctionNamesAllValid_: keyof ElectronBridge.MainToPrimaryRendererAsyncApi = "" as MainToPrimaryRendererAsyncApiFunctionName;
pretendWeHaveUsedInputToMakeTypeScriptHappy(_testOfMainToAllRenderersFunctionNamesAllValid_, _testOfMainToAllRenderersFunctionNamesIncludesAll_);


const implementRendererToMainSyncFnInMainProcess = implementIpcSyncApiServerFn(ipcMain);
const implementRendererToMainAsyncFnInMainProcess = implementIpcAsyncApiServerFn(ipcMain);

export const implementRendererToMainAsyncApiServerInMainProcess = (implementation: ElectronBridge.RendererToMainAsyncApi) => {
  (Object.keys(implementation) as (keyof ElectronBridge.RendererToMainAsyncApi)[])
    .forEach( (fnName) => implementRendererToMainAsyncFnInMainProcess(fnName, implementation[fnName]) );
  }

export const implementRendererToMainSyncApiServerInMainProcess = (implementation: ElectronBridge.RendererToMainSyncApi) => {
  (Object.keys(implementation) as (keyof ElectronBridge.RendererToMainSyncApi)[])
    .forEach( (fnName) => implementRendererToMainSyncFnInMainProcess(fnName, implementation[fnName]) );
  }

export const implementMainToRendererAsyncClientInMainProcess = () => {
  return MainToPrimaryRendererAsyncApiFunctionNames.reduce( <FN_NAME extends keyof ElectronBridge.MainToPrimaryRendererAsyncApi>(
    api: Partial<ElectronBridge.MainToPrimaryRendererAsyncApi>, fnName: FN_NAME) => {
    api[fnName] = implementIpcAsyncApiClientFnInMain(fnName);
    return api;
  }, {} as Partial<ElectronBridge.MainToPrimaryRendererAsyncApi> ) as ElectronBridge.MainToPrimaryRendererAsyncApi;
}
export const mainToRendererAsyncClient = implementMainToRendererAsyncClientInMainProcess();

export const implementMainToAllRenderersClientInMainProcess = () => {
  return MainToAllRenderersApiFunctionNames.reduce( <FN_NAME extends keyof ElectronBridge.MainToAllRenderersApi>(
    api: Partial<ElectronBridge.MainToAllRenderersApi>, fnName: FN_NAME) => {
    api[fnName] = implementIpcSendBroadcastFromElectronToAllRenderersFn(fnName);
    return api;
  }, {} as Partial<ElectronBridge.MainToAllRenderersApi>) as ElectronBridge.MainToAllRenderersApi;
}
export const mainToAllRenderersClient = implementMainToAllRenderersClientInMainProcess();
  

