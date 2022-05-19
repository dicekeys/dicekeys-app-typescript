import {platform} from "os";
import {execFileSync} from "child_process";

import type { ElectronBridgeConstants } from "./ElectronBridge";

export const getCommandLineArguments = (): string[] => {
  /**
    When executed with electron command the first two arguments are the path and the executable name,
    so the actual command line arguments start at index 2. When executed as packed binary the actual
    command line arguments start at index 1.
    See: https://nodejs.org/docs/latest/api/process.html#process_process_argv.
    The constant represents only the arguments that follow the path and executable name.
  */
  const argv = process.argv
  if(argv[0].toLowerCase().endsWith("electron")){
      return argv.slice(2)
  }else{
      return argv.slice(1)
  }
};

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
      requiresWindowsAdmin,
      commandLineArgs: getCommandLineArguments(),
    } as const;
  }
export const electronBridgeConstants = getElectronBridgeConstants();
  