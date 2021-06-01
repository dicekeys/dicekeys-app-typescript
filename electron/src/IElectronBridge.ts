interface IElectronBridgeSync {
  writeResultToStdOutAndExit(result: string): void;
  getCommandLineArguments(): string[];
  getDeepLink(): string[];
}

interface IElectronBridgeAsync {
  openFileDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
  openMessageDialog(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue>;
}

interface IElectronBridgeListener {
  setDeepLinkListener(fn: (deepLink: string[]) => void): void
}

export interface IElectronBridge extends IElectronBridgeSync, IElectronBridgeAsync, IElectronBridgeListener {
}

export const responseChannelNameFor = <T extends string> (channelName: T) => `${channelName}-response` as const;
export const exceptionCodeFor = <T extends string> (code: T) => `exception:${code}` as const;

export type ElectronIpcSyncRequestChannelName = keyof IElectronBridgeSync;
export type ElectronIpcAsyncRequestChannelName = keyof IElectronBridgeAsync;

export type ElectronBridgeAsyncApiRequest<ElectronBridgeApiChannelName extends ElectronIpcAsyncRequestChannelName> =
  Parameters<IElectronBridge[ElectronBridgeApiChannelName]>;
 
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type ElectronBridgeAsyncApiResponse<ElectronBridgeApiChannelName extends ElectronIpcAsyncRequestChannelName> =
  Awaited<ReturnType<IElectronBridge[ElectronBridgeApiChannelName]>>;

export type ElectronBridgeSyncApiRequest<ElectronBridgeApiChannelName extends ElectronIpcSyncRequestChannelName> =
  Parameters<IElectronBridge[ElectronBridgeApiChannelName]>;
  
export type ElectronBridgeSyncApiResponse<ElectronBridgeApiChannelName extends ElectronIpcSyncRequestChannelName> =
  ReturnType<IElectronBridge[ElectronBridgeApiChannelName]>;

