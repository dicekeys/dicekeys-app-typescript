import {platform} from "os";
import {execFileSync} from "child_process";
import type { ElectronBridgeConstants } from "./ElectronBridge";

const getElectronBridgeConstants = (): ElectronBridgeConstants => {
  const osPlatform = platform();
  const isWindows = osPlatform === "win32";
  
  const isWindowsAdmin = !isWindows ? false : (() => {
    try {
      execFileSync( "net", ["session"], { "stdio": "ignore" } );
      return true;
    }
    catch {
      return false
    }    
  })();
  const requiresWindowsAdmin = isWindows && !isWindowsAdmin;
  
    return {
      osPlatform,
      requiresWindowsAdmin
    } as const;
  }
export const electronBridgeConstants = getElectronBridgeConstants();
  