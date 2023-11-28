/**
 * DiceKeys as 75 characters, with each element represented as a
 * three-character sequence of:
 *   letter,
 *   digit ['1' - '6'],
 *   FaceRotationLetter
 * [letter][digit][FaceRotationLetter]
 */
 enum DiceKeyInHumanReadableFormType { _ = "" };
 export type DiceKeyInHumanReadableForm = DiceKeyInHumanReadableFormType & string;


export interface DiceKeyMemoryStoreStorageFormat {
  keyIdToDiceKeyInHumanReadableForm: [string, DiceKeyInHumanReadableForm][];
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
  setSynchronizedStringState: (key:string, newValue: string | undefined) => void;
//  broadcastUpdateToDiceKeyMemoryStore(storedDiceKeys: DiceKeyMemoryStoreStorageFormat): void;
//  getDiceKeyMemoryStore: () => DiceKeyMemoryStoreStorageFormat;
  getSynchronizedStringState: (key: string) => string | undefined;
  writeResultToStdOutAndExit(result: string): void;
}

export interface RendererToMainDiceKeysStoreAsyncApi {
  getDiceKeyFromCredentialStore(id: string): Promise<string | null>
  storeDiceKeyInCredentialStore(id: string, humanReadableForm: string): Promise<void>
  deleteDiceKeyFromCredentialStore(id: string): Promise<boolean>
}

export interface ElectronBridgeConstants {
  osPlatform: NodeJS.Platform;
  requiresWindowsAdmin: boolean;
  commandLineArgs: string[];
}

export type RemoveListener = () => void;

export interface MainToPrimaryRendererAsyncApi {
  getRecipesToExport: () => Promise<string>;
  loadRandomDiceKey: () => void;
  loadFromShares: () => void;
  importRecipes: (jsonRecipesToImport: string) => void;
}

export interface MainToAllRenderersApi {
  broadcastUpdatedSynchronizedStringState: (key: string, newValue: string | undefined) => void;
//  updateDiceKeyMemoryStore: (storedDiceKeys: DiceKeyMemoryStoreStorageFormat) => void;
}

export type MainToPrimaryRendererAsyncApiImplementationFunctions = {
  [key in keyof MainToPrimaryRendererAsyncApi]:
    ((...args: Parameters<MainToPrimaryRendererAsyncApi[key]>) => ReturnType<MainToPrimaryRendererAsyncApi[key]>);
}

//export type ImplementMainToRendererSyncApi = (implementation: MainToRendererSyncApiImplementationFunctions) => void;
export type ImplementMainToPrimaryRendererAsyncApi = (implementation: MainToPrimaryRendererAsyncApiImplementationFunctions) => void;
export type ImplementMainToAllRenderersApi = (implementation: MainToAllRenderersApi) => void;

export type SaveTextFileParameters = {
  content: string,
  fileName: string
  requiredExtension?: string,
}

export interface RendererToMainAsyncApi extends
  RendererToMainDiceKeysStoreAsyncApi
{
  saveUtf8File(saveTextFileParameters: SaveTextFileParameters): Promise<boolean>;
  openLinkInBrowser(url: string): Promise<void>;
}

export interface ElectronBridgeRendererView extends ElectronBridgeConstants, RendererToMainAsyncApi, RendererToMainSyncApi {
  implementMainToPrimaryRendererAsyncApi: ImplementMainToPrimaryRendererAsyncApi;
  implementMainToAllRenderersApi: ImplementMainToAllRenderersApi;
}

