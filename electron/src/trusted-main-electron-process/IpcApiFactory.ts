import {IpcMain, ipcMain, IpcRenderer, ipcRenderer, WebContents} from 'electron';

export const requestChannelNameFor = <T extends string> (functionName: T) => `api:${functionName}:request` as const;
export const successResponseChannelName = <FN_NAME extends string>(
  fnName: FN_NAME, nonce: Nonce
) => `api-response-success:${fnName}:${nonce}` as const;
export const errorResponseChannelName = <FN_NAME extends string>(
  fnName: FN_NAME, nonce: Nonce
) => `api-response-error:${fnName}:${nonce}` as const;

export const getNonce = () => `:${Math.random()}:${Math.random()}:` as const;
export type Nonce = ReturnType<typeof getNonce>;

export const getRequestSpecificResponseChannelNames = <FN_NAME extends string = string>(fnName: FN_NAME, nonce: Nonce = getNonce()) => ({
  successResponseChannelName: successResponseChannelName(fnName, nonce),
  errorResponseChannelName: errorResponseChannelName(fnName, nonce),
} as const)
export type RequestSpecificResponseChannelNames = ReturnType<typeof getRequestSpecificResponseChannelNames>;

export interface IpcListener {
  on(channel: string, listener: (event: Electron.IpcMainEvent | Electron.IpcRendererEvent, ...args: any[]) => void): void;
  removeAllListeners(channelName: string): void;
}

export const implementIpcSyncApiServerFn = (
  server: IpcMain = ipcMain
) =>
  <FN extends ((...args: any[]) => any)>(
    fnName: string,
    implementation:  (...args: Parameters<FN>) => ReturnType<FN>
  ) => {
    server.on(requestChannelNameFor(fnName), (event, ...args) => {
      try {
        const result: ReturnType<FN> = implementation(...(args as Parameters<FN>));
        event.returnValue = result;
      } catch (e) {
        event.returnValue = e;
      }
  })
}

export const implementIpcSyncApiClietFn = (
  client: IpcRenderer = ipcRenderer
 ) =>
    <FN extends ((...args: any[]) => any)>(fnName: string) =>
      (
        ...args: Parameters<FN>
      ): ReturnType<FN> => 
        client.sendSync(requestChannelNameFor(fnName), ...args) as ReturnType<FN>;

export const implementIpcAsyncApiClietFn = (
  clientSender: WebContents | IpcRenderer = ipcRenderer,
  clientListener: IpcListener = ipcRenderer
) =>
//  client: {sendSync(channel: string, ...args: any[]): any;}) =>
    <FN extends ((...args: any[]) => any)>(fnName: string) =>
      (
        ...args: Parameters<FN>
      ): Promise<Awaited<ReturnType<FN>>> => {
  return new Promise<Awaited<ReturnType<FN>>>( (resolve, reject) => {
    // Create a code that allows us to match requests to responses
    const requestSpecificResponseChannelNames = getRequestSpecificResponseChannelNames(fnName);
    const {successResponseChannelName, errorResponseChannelName} = requestSpecificResponseChannelNames;
    const stopListeningForResponsesToThisRequest = () => {
      // Because these two channels were constrcuted exclusively for the request, and are
      // identified by a one-time nonce, we can remove all associated with the request.
      clientListener.removeAllListeners(successResponseChannelName);
      clientListener.removeAllListeners(errorResponseChannelName);
    }
    clientListener.on(successResponseChannelName, (_event, result) => {
      stopListeningForResponsesToThisRequest();
      resolve(result as ReturnType<FN>);
    })
    clientListener.on(errorResponseChannelName, (_event, error) => {
      stopListeningForResponsesToThisRequest();
      reject(error);
    })
    clientSender.send(requestChannelNameFor(fnName), requestSpecificResponseChannelNames, ...args);
  });

}
export const implementIpcAsyncApiServerFn = (
  server: {
    on(channel: string, listener: (event: Electron.IpcMainEvent | Electron.IpcRendererEvent, ...args: any[]) => void): void;
  }
) =>
  <FN extends ((...args: any[]) => any)>(
    fnName: string,
    implementation:  (...args: Parameters<FN>) => ReturnType<FN>
  ) => {
    server.on(requestChannelNameFor(fnName), async (event, responseChannels, ...args) => {
      // console.log(`API Server Function ${fnName}`, responseChannels, args);
      const {successResponseChannelName, errorResponseChannelName} = responseChannels as RequestSpecificResponseChannelNames;
      try {
        const result: Awaited<ReturnType<FN>> = await implementation(...(args as Parameters<FN>));
        // console.log(`API Server Function ${fnName} success`, responseChannels, args);
        event.sender.send(successResponseChannelName, result)
      } catch (exception) {
        console.log(`API Server Function ${fnName} failed`, exception);
        event.sender.send(errorResponseChannelName, exception)
      }
  })
}
