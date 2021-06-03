import * as Electron from "electron";

export interface Device {
  locationId: number;
  vendorId: number;
  productId: number;
  deviceName: string;
  manufacturer: string;
  serialNumber: string;
  deviceAddress: number;
}

interface IElectronBridgeSync {
  writeResultToStdOutAndExit(result: string): void;
  getCommandLineArguments(): string[];
}

interface IElectronBridgeAsync {
  openFileDialog(options: Electron.OpenDialogOptions): Promise<Electron.OpenDialogReturnValue>;
  openMessageDialog(options: Electron.MessageBoxOptions): Promise<Electron.MessageBoxReturnValue>;
}

export type RemoveListener = () => void;
interface IElectronBridgeListener {
  listenForSeedableSecurityKeys(successCallback: (devices: Device[]) => any, errorCallback: (error: any) => any): RemoveListener;
}

export interface IElectronBridge extends IElectronBridgeSync, IElectronBridgeAsync, IElectronBridgeListener {
}

export const responseChannelNameFor = <T extends string> (channelName: T) => `${channelName}-response` as const;
export const terminateChannelNameFor = <T extends string> (channelName: T) => `${channelName}-terminate` as const;
export const exceptionCodeFor = <T extends string> (code: T) => `exception:${code}` as const;

export type ElectronIpcSyncRequestChannelName = keyof IElectronBridgeSync;
export type ElectronIpcAsyncRequestChannelName = keyof IElectronBridgeAsync;
export type ElectronIpcListenerRequestChannelName = keyof IElectronBridgeListener;

export type ElectronBridgeAsyncApiRequest<ElectronBridgeApiChannelName extends ElectronIpcAsyncRequestChannelName> =
  Parameters<IElectronBridge[ElectronBridgeApiChannelName]>;
 
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type ElectronBridgeAsyncApiResponse<ElectronBridgeApiChannelName extends ElectronIpcAsyncRequestChannelName> =
  Awaited<ReturnType<IElectronBridge[ElectronBridgeApiChannelName]>>;

export type ElectronBridgeSyncApiRequest<ElectronBridgeApiChannelName extends ElectronIpcSyncRequestChannelName> =
  Parameters<IElectronBridge[ElectronBridgeApiChannelName]>;
  
export type ElectronBridgeSyncApiResponse<ElectronBridgeApiChannelName extends ElectronIpcSyncRequestChannelName> =
  ReturnType<IElectronBridge[ElectronBridgeApiChannelName]>;

export type ElectronBridgeListener<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    IElectronBridge[CHANNEL];
export type ElectronBridgeListenerParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    Parameters<ElectronBridgeListener<CHANNEL>>;

export type ElectronBridgeListenerApiCallback<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    ElectronBridgeListenerParameters<CHANNEL>[0];
export type ElectronBridgeListenerApiErrorCallback<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    ElectronBridgeListenerParameters<CHANNEL>[1];
type TupleBeyondSecondElement<T> = T extends[a: any, b: any, ...args: infer A] ? A : never;
export type ElectronBridgeListenerApiSetupArgs<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    TupleBeyondSecondElement<ElectronBridgeListenerParameters<CHANNEL>>;

export type ElectronBridgeListenerApiCallbackParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
  Parameters<ElectronBridgeListenerApiCallback<CHANNEL>>;
// Parameters<ElectronBridgeListenerApiCallback<CHANNEL>> extends [] ? Parameters<ElectronBridgeListenerApiCallback<CHANNEL>> : [];
export type ElectronBridgeListenerApiErrorCallbackParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    Parameters<ElectronBridgeListenerApiErrorCallback<CHANNEL>>;
