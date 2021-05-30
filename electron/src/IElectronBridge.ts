export interface IElectronBridge extends Record<string, any>{
    cliResult(result: string): void;
    cliArgs(): string;
    openFileDialog(options: Electron.OpenDialogOptions, code: string): Promise<Electron.OpenDialogReturnValue>;
    openMessageDialog(options: Electron.MessageBoxOptions, code: string): Promise<Electron.MessageBoxReturnValue>;
}
