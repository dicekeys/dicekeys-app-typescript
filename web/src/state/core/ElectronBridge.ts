import type {ElectronBridgeRendererView} from "../../../../common/IElectronBridge";
export const electronBridge = (window as unknown as {ElectronBridge: ElectronBridgeRendererView}).ElectronBridge;