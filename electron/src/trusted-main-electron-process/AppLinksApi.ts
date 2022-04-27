import {app} from "electron";

const findAppLink = (commandLineArgs: string[]) =>
  commandLineArgs.find((value) =>
    value.indexOf("dicekeys://") !== -1 && value.indexOf("command=") !== -1
  );

export class AppLinkHandler {
  mostRecentAppLinkUrl?: string;

  constructor(private sendAppLinkToClient: (url: string) => void, commandLineArgs: string[] = process.argv) {
    // Register this application to receive dicekeys:// application links
    app.setAsDefaultProtocolClient('dicekeys');
    this.mostRecentAppLinkUrl = findAppLink(commandLineArgs);
  }

  processArgsForAppLink = (commandLineArgV: string[]) => {
    const url = findAppLink(commandLineArgV);
    if (url != null) {
      this.mostRecentAppLinkUrl = url;
      this.sendAppLinkToClient(url);
    }
  }

  getAppLink = () => this.mostRecentAppLinkUrl;
}
