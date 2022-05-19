import {app} from "electron";
import {resolve} from "path";
import { getCommandLineArguments } from "./ElectronBridgeConstants";

const findAppLink = (commandLineArgs: string[]) =>
  commandLineArgs.find((value) =>
    value.indexOf("dicekeys:/") !== -1 && value.indexOf("command=") !== -1
  );

export class AppLinkHandler {
  mostRecentAppLinkUrl?: string;

  processArgsForAppLink = (commandLineArgV: string[]) => {
    const url = findAppLink(commandLineArgV);
    if (url != null) {
      this.mostRecentAppLinkUrl = url;
      this.sendAppLinkToClient(url);
    }
  }

  // getAppLink = () => this.mostRecentAppLinkUrl;
  
  constructor(private sendAppLinkToClient: (url: string) => void, commandLineArgs: string[] = getCommandLineArguments()) {
    // Register this application to receive dicekeys:/ application links
    if (!app.isPackaged && process.platform === 'win32') {
      // Set the path of electron.exe and your app.
      // These two additional parameters are only available on windows.
      // Setting this is required to get this working in dev mode.
      app.setAsDefaultProtocolClient('dicekeys', process.execPath, [
        resolve(process.argv[1])
      ]);
    } else {
      app.setAsDefaultProtocolClient('dicekeys');
    }
        this.processArgsForAppLink(commandLineArgs);
//    this.mostRecentAppLinkUrl = findAppLink(commandLineArgs);
  }

}
