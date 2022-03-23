import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue
} from "electron";

export {
  OpenDialogOptions,
  OpenDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue
}

export interface DeviceUniqueIdentifier {
  vendorId: number;
  productId: number;
  serialNumber: string;
}

export interface Device extends DeviceUniqueIdentifier {
  locationId: number;
  deviceName: string;
  manufacturer: string;
  deviceAddress: number;
}

export interface IElectronBridgeSync {
  openExternal(url: string): void;
  writeResultToStdOutAndExit(result: string): void;
  getCommandLineArguments(): string[];
  getAppLink(): string;
}

export interface IElectronBridgeDialogsAsync{
  openFileDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>;
  openMessageDialog(options: MessageBoxOptions): Promise<MessageBoxReturnValue>;
}
export interface IElectronBridgeDiceKeysStoreAsync {
  getDiceKeyFromCredentialStore(id: string): Promise<string | null>
  storeDiceKeyInCredentialStore(id: string, humanReadableForm: string): Promise<void>
  deleteDiceKeyFromCredentialStore(id: string): Promise<boolean>
  // getDiceKeys(): Promise<{ id: string, humanReadableForm: string}[]>
  // getDiceKeyIdsAndCenterFaces(): Promise<{id: string, letter: string, digit: string}[]>;
}

interface IElectronBridgeConstants {
  osPlatform: NodeJS.Platform;
  requiresWindowsAdmin: boolean;
}

export type RemoveListener = () => void;
export interface IElectronBridgeListener {
  listenForAppLinks(callback: (appLink: string) => any, errorCallback: (error: any) => any): RemoveListener;
// for testing typings only  fix(sc: (a: string, b: number) => any, ec: (error: any) => any): RemoveListener;
}

export interface IElectronBridgeAsync extends
  IElectronBridgeDialogsAsync,
  IElectronBridgeDiceKeysStoreAsync
{}

export interface IElectronBridge extends IElectronBridgeSync, IElectronBridgeAsync, IElectronBridgeListener, IElectronBridgeConstants {
}

