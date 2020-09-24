export const reportException = (e: Error, extraInfo?: string): void => {
  console.log("Exception", e);
  document.body.innerHTML = ""
  const pre = document.createElement("pre");
  pre.textContent += "Please copy the text of this error and report it to beta@dicekeys.com." + "\n\n" ;
  if (typeof e === "object" && e instanceof Error) {
    pre.textContent += e.name + "\n\n" + e.message + "\n\n" +
      (extraInfo != null ? extraInfo + "\n\n" : "") 
      e.stack ?? "no stack found";
  } else {
    pre.textContent += JSON.stringify(e);
  }
  document.body.appendChild(pre)
}