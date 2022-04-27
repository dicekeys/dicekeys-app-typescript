import {ipcRenderer} from 'electron';
import * as ElectronBridge from "./ElectronBridge";
import {
  implementIpcAsyncApiServerFn,
  implementIpcSyncApiClietFn,
  implementIpcAsyncApiClientFn
} from "./IpcApiFactory";
import type {
  RendererToMainAsyncApi,
  RendererToMainSyncApi
//  RemoveListener
} from "./ElectronBridge";

export const implementMainToRendererAsyncFnInRendererProcess = implementIpcAsyncApiServerFn(ipcRenderer);

export const implementRendererToMainSyncClientInRendererProcess = 
  <FN_NAME extends keyof ElectronBridge.RendererToMainSyncApi>(
    fnName: FN_NAME
  ): ElectronBridge.RendererToMainSyncApi[FN_NAME] =>
    implementIpcSyncApiClietFn()(fnName);

export const implementRendererToMainAsyncClientInRendererProcess = 
  <FN_NAME extends keyof ElectronBridge.RendererToMainAsyncApi>(
    fnName: FN_NAME
  ): ElectronBridge.RendererToMainAsyncApi[FN_NAME] =>
    implementIpcAsyncApiClientFn()(fnName);

export const implementMainToRendererAsyncApiServerInRendererProcess = (implementation: ElectronBridge.MainToRendererAsyncApi) => {
  (Object.keys(implementation) as (keyof ElectronBridge.MainToRendererAsyncApi)[])
    .forEach( (fnName) => implementMainToRendererAsyncFnInRendererProcess(fnName, implementation[fnName]) );
  }

  const pretendWeHaveUsedInputToMakeTypeScriptHappy = <T extends unknown[]>(..._args: T) => {}

  const rendererToMainAsyncFunctionNames = [
    "deleteDiceKeyFromCredentialStore",
    "getDiceKeyFromCredentialStore",
    "openLinkInBrowser",
    "saveUtf8File",
    "storeDiceKeyInCredentialStore",
  ] as const;
  type RendererToMainAsyncFunctionNames = (typeof rendererToMainAsyncFunctionNames)[number];
  // Ensure we've enumerated all function names
  const _testOfRendererToMainAsyncFunctionNamesIncludesAll_: RendererToMainAsyncFunctionNames = "" as (keyof RendererToMainAsyncApi);
  // Ensure we've only written valid function names
  const _testOfRendererToMainAsyncFunctionNamesAllValid_: keyof RendererToMainAsyncApi = rendererToMainAsyncFunctionNames[0 as number];
  pretendWeHaveUsedInputToMakeTypeScriptHappy(_testOfRendererToMainAsyncFunctionNamesAllValid_, _testOfRendererToMainAsyncFunctionNamesIncludesAll_);
  
  const rendererToMainSyncFunctionNames = [
    "getAppLink",
    "getCommandLineArguments",
    "openExternal",
    "writeResultToStdOutAndExit"
  ] as const;
  type RendererToMainSyncFunctionNames = (typeof rendererToMainSyncFunctionNames)[number];
  // Ensure we've enumerated all function names
  const _testOfRendererToMainSyncFunctionNamesIncludesAll_: RendererToMainSyncFunctionNames = "" as (keyof RendererToMainSyncApi);
  // Ensure we've only written valid function names
  const _testOfRendererToMainSyncFunctionNamesAllValid_: keyof RendererToMainSyncApi = rendererToMainSyncFunctionNames[0 as number];
  pretendWeHaveUsedInputToMakeTypeScriptHappy(_testOfRendererToMainSyncFunctionNamesAllValid_, _testOfRendererToMainSyncFunctionNamesIncludesAll_);
  
  
export const rendererToMainAsyncApi = rendererToMainAsyncFunctionNames.reduce( <FN_NAME extends keyof RendererToMainAsyncApi>(
  api: Partial<RendererToMainAsyncApi>, fnName: FN_NAME) => {
  api[fnName] = implementRendererToMainAsyncClientInRendererProcess(fnName);
  return api;
}, {} as Partial<RendererToMainAsyncApi> ) as RendererToMainAsyncApi;

export const rendererToMainSyncApi = rendererToMainSyncFunctionNames.reduce( <FN_NAME extends keyof RendererToMainSyncApi>(
  api: Partial<RendererToMainSyncApi>, fnName: FN_NAME) => {
  api[fnName] = implementRendererToMainSyncClientInRendererProcess(fnName);
  return api;
}, {} as Partial<RendererToMainSyncApi> ) as RendererToMainSyncApi;
