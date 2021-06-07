import type {
  IElectronBridgeSync,
  IElectronBridgeAsync,
  IElectronBridgeListener,
  IElectronBridge,
  RemoveListener
} from "../../../common/IElectronBridge"
export type {
  IElectronBridgeSync,
  IElectronBridgeAsync,
  IElectronBridgeListener,
  IElectronBridge,
  RemoveListener
}

export const responseChannelNameFor = <T extends string> (channelName: T) => `${channelName}-response` as const;
export const terminateChannelNameFor = <T extends string> (channelName: T) => `${channelName}-terminate` as const;
export const exceptionCodeFor = <T extends string> (code: T) => `exception:${code}` as const;

export type ElectronIpcSyncRequestChannelName = keyof IElectronBridgeSync;
export type ElectronIpcAsyncRequestChannelName = keyof IElectronBridgeAsync;
export type ElectronIpcListenerRequestChannelName = keyof IElectronBridgeListener;

// Async
export type ElectronBridgeAsyncFn<CHANNEL extends ElectronIpcAsyncRequestChannelName> =
  IElectronBridgeAsync[CHANNEL];
export type ElectronBridgeAsyncApiRequest<CHANNEL extends ElectronIpcAsyncRequestChannelName> =
  Parameters<ElectronBridgeAsyncFn<CHANNEL>>;

export type ElectronBridgeAsyncApiResponse<CHANNEL extends ElectronIpcAsyncRequestChannelName> =
  ReturnType<IElectronBridgeAsync[CHANNEL]>;

// Sync
export type ElectronBridgeSyncFn<CHANNEL extends ElectronIpcSyncRequestChannelName> =
  IElectronBridgeSync[CHANNEL]
export type ElectronBridgeSyncApiRequest<CHANNEL extends ElectronIpcSyncRequestChannelName> =
  Parameters<ElectronBridgeSyncFn<CHANNEL>>;
export type ElectronBridgeSyncApiResponse<CHANNEL extends ElectronIpcSyncRequestChannelName> =
  ReturnType<ElectronBridgeSyncFn<CHANNEL>>;

// Listener
export type ElectronBridgeListenerFn<CHANNEL extends ElectronIpcListenerRequestChannelName> =
  IElectronBridgeListener[CHANNEL];
export type ElectronBridgeListenerParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    Parameters<ElectronBridgeListenerFn<CHANNEL>>;

export type ElectronBridgeListenerApiCallback<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    ElectronBridgeListenerParameters<CHANNEL>[0];
export type ElectronBridgeListenerApiErrorCallback<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    ElectronBridgeListenerParameters<CHANNEL>[1];
type TupleBeyondSecondElement<T> = T extends[a: any, b: any, ...args: infer A] ? A : never;
export type ElectronBridgeListenerApiSetupArgs<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    TupleBeyondSecondElement<ElectronBridgeListenerParameters<CHANNEL>>;

export type ElectronBridgeListenerApiCallbackParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
  Parameters<ElectronBridgeListenerApiCallback<CHANNEL>>;
export type ElectronBridgeListenerApiErrorCallbackParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    Parameters<ElectronBridgeListenerApiErrorCallback<CHANNEL>>;
