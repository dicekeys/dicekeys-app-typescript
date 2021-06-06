import type {
  IElectronBridgeSync,
  IElectronBridgeAsync,
  IElectronBridgeListener,
  IElectronBridge,
  RemoveListener
} from "../../common/IElectronBridge"
export {
  IElectronBridgeSync,
  IElectronBridgeAsync,
  IElectronBridgeListener,
  IElectronBridge,
  RemoveListener
}
// export * from "../../common/IElectronBridge";

export const responseChannelNameFor = <T extends string> (channelName: T) => `${channelName}-response` as const;
export const terminateChannelNameFor = <T extends string> (channelName: T) => `${channelName}-terminate` as const;
export const exceptionCodeFor = <T extends string> (code: T) => `exception:${code}` as const;

export type ElectronIpcSyncRequestChannelName = keyof IElectronBridgeSync;
export type ElectronIpcAsyncRequestChannelName = keyof IElectronBridgeAsync;
export type ElectronIpcListenerRequestChannelName = keyof IElectronBridgeListener;

export type ElectronBridgeAsyncApiRequest<ElectronBridgeApiChannelName extends ElectronIpcAsyncRequestChannelName> =
  Parameters<IElectronBridgeAsync[ElectronBridgeApiChannelName]>;
 
type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T;
export type ElectronBridgeAsyncApiResponse<ElectronBridgeApiChannelName extends ElectronIpcAsyncRequestChannelName> =
  Awaited<ReturnType<IElectronBridgeAsync[ElectronBridgeApiChannelName]>>;

export type ElectronBridgeSyncApiRequest<ElectronBridgeApiChannelName extends ElectronIpcSyncRequestChannelName> =
  Parameters<IElectronBridgeSync[ElectronBridgeApiChannelName]>;
  
export type ElectronBridgeSyncApiResponse<ElectronBridgeApiChannelName extends ElectronIpcSyncRequestChannelName> =
  ReturnType<IElectronBridgeSync[ElectronBridgeApiChannelName]>;

export type ElectronBridgeListener<CHANNEL extends ElectronIpcListenerRequestChannelName> =
  IElectronBridgeListener[CHANNEL];
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
export type ElectronBridgeListenerApiErrorCallbackParameters<CHANNEL extends ElectronIpcListenerRequestChannelName> =
    Parameters<ElectronBridgeListenerApiErrorCallback<CHANNEL>>;
