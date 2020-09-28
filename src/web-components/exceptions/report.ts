import { browserInfo } from "~utilities/browser";

export const reportException = (e: Error, extraInfo?: string): void => {
  console.log("Exception", e, extraInfo);
  document.body.innerHTML = ""
  const pre = document.createElement("pre");
  pre.textContent += "Please copy the text of this error and report it to beta@dicekeys.com." + "\n\n" ;
  if (typeof e === "object" && e instanceof Error) {
    pre.textContent += e.name + "\n\n" + e.message + "\n\n" +
      (extraInfo != null ? extraInfo + "\n\n" : "") +
      (e.stack ?? "no stack found") + "\n\n" +
      window.location.host + "\n" + JSON.stringify(browserInfo, undefined, "\t") + "\n\n" +
      navigator.appVersion + "\n" +
      navigator.userAgent + "\n" +
      navigator.appName;
  } else {
    pre.textContent += JSON.stringify(e);
  }
  document.body.appendChild(pre)
}