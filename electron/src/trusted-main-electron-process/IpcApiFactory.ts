import {ipcMain} from 'electron';
import type {
  // IElectronBridgeSync,
  // IElectronBridgeAsync,
  // IElectronBridgeListener,
  RemoveListener
} from "../../../common/IElectronBridge"

import * as ElectronBridge from "./ElectronBridge";

export const implementSyncApi = <CHANNEL extends ElectronBridge.ElectronIpcSyncRequestChannelName>(
  channel: CHANNEL,
  implementation: (...args: ElectronBridge.ElectronBridgeSyncApiRequest<CHANNEL>) => ElectronBridge.ElectronBridgeSyncApiResponse<CHANNEL>
) => {
  ipcMain.on(channel, (event, ...args) => {
    try {
      event.returnValue = implementation(...(args as Parameters<typeof implementation>));
    } catch (e) {
      event.returnValue = e;
    }
  })
}

export const implementAsyncApi = <CHANNEL extends ElectronBridge.ElectronIpcAsyncRequestChannelName>(
  channel: CHANNEL,
  implementation:  (...args: ElectronBridge.ElectronBridgeAsyncApiRequest<CHANNEL>) => ElectronBridge.ElectronBridgeAsyncApiResponse<CHANNEL>
) => {
      const responseChannelName = ElectronBridge.responseChannelNameFor(channel);
      ipcMain.on(channel, (event, code, ...args) => {
        implementation(...(args as ElectronBridge.ElectronBridgeAsyncApiRequest<CHANNEL>)).then( (response: any) =>
          event.sender.send(responseChannelName, code, response)
        ).catch( exception =>
          event.sender.send(responseChannelName, ElectronBridge.exceptionCodeFor(code), exception)
        )
  })
}

export const implementListenerApi = <CHANNEL extends ElectronBridge.ElectronIpcListenerRequestChannelName>(channel: CHANNEL,
    implementation: ElectronBridge.ElectronBridgeListenerFn<CHANNEL>
  ) => {
  const responseChannelName = ElectronBridge.responseChannelNameFor(channel);
  const listenerCodeToRemovalFunction = new Map<string, RemoveListener>();
  ipcMain.on(ElectronBridge.terminateChannelNameFor(channel), (_event: Electron.IpcMainEvent, code) => {
    // Run the termination function
    listenerCodeToRemovalFunction.get(code)?.();
  })
  ipcMain.on(channel, (event: Electron.IpcMainEvent, ...args: any[]) => {
    const [code, ...setupArgs] = args as [string, ElectronBridge.ElectronBridgeListenerApiSetupArgs<CHANNEL>];
    const removeListener = implementation(
      // ElectronIpcListenerRequestChannelName in below line should be CHANNEL, but appears to be typescript bug here
      (...callbackArgs: ElectronBridge.ElectronBridgeListenerApiCallbackParameters<ElectronBridge.ElectronIpcListenerRequestChannelName>) => {
        event.sender.send(responseChannelName, code, ...callbackArgs)
      },
      // ElectronIpcListenerRequestChannelName in below line should be CHANNEL, but appears to be typescript bug here
      (...errorCallbackArgs: ElectronBridge.ElectronBridgeListenerApiErrorCallbackParameters<ElectronBridge.ElectronIpcListenerRequestChannelName>) => {
        event.sender.send( responseChannelName, ElectronBridge.exceptionCodeFor(code), ...errorCallbackArgs)
      },
      ...(setupArgs as unknown as []) // FIXME to make typescript happy
    )
    listenerCodeToRemovalFunction.set(code, removeListener)
  })
}
