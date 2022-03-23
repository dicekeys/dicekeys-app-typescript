import type {IElectronBridge} from "../../../../common/IElectronBridge";
export const electronBridge = (window as unknown as {ElectronBridge: IElectronBridge}).ElectronBridge;