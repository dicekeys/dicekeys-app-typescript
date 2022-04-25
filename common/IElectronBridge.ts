import type {
  OpenDialogOptions,
  OpenDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue,
  SaveDialogOptions
} from "electron";

export {
  OpenDialogOptions,
  OpenDialogReturnValue,
  MessageBoxOptions,
  MessageBoxReturnValue,
  SaveDialogOptions
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

export interface RendererToMainSyncApi {
  openExternal(url: string): void;
  writeResultToStdOutAndExit(result: string): void;
  getCommandLineArguments(): string[];
  getAppLink(): string | undefined;
}

export interface RendererToMainDeprecatedAsyncApi{
  // openFileDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>;
  // openMessageDialog(options: MessageBoxOptions): Promise<MessageBoxReturnValue>;
}
export interface RendererToMainDiceKeysStoreAsyncApi {
  getDiceKeyFromCredentialStore(id: string): Promise<string | null>
  storeDiceKeyInCredentialStore(id: string, humanReadableForm: string): Promise<void>
  deleteDiceKeyFromCredentialStore(id: string): Promise<boolean>
}

export interface ElectronBridgeConstants {
  osPlatform: NodeJS.Platform;
  requiresWindowsAdmin: boolean;
}

export type RemoveListener = () => void;

export interface MainToRendererAsyncApi {
  getRecipesToExport: () => Promise<string>;
  handleAppLink: (appLink: string) => void;
  importRecipes: (jsonRecipesToImport: string) => void;
}

export type MainToRendererAsyncApiImplementationFunctions = {
  [key in keyof MainToRendererAsyncApi]:
    ((...args: Parameters<MainToRendererAsyncApi[key]>) => ReturnType<MainToRendererAsyncApi[key]>);
}

//export type ImplementMainToRendererSyncApi = (implementation: MainToRendererSyncApiImplementationFunctions) => void;
export type ImplementMainToRendererAsyncApi = (implementation: MainToRendererAsyncApiImplementationFunctions) => void;

export interface RendererToMainAsyncApi extends
  RendererToMainDeprecatedAsyncApi,
  RendererToMainDiceKeysStoreAsyncApi
{}

export interface ElectronBridgeRendererView extends ElectronBridgeConstants, RendererToMainAsyncApi, RendererToMainSyncApi {
  implementMainToRendererAsyncApi: ImplementMainToRendererAsyncApi;
}

