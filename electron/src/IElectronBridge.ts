export interface IElectronBridge extends Record<string, any>{
    cliResult(result: string): void;
}
