export const reportException = (e: unknown): void => {
  if (typeof e === "string") {
    // We need to throw an exception to get a stack
    try {
      throw new Error(e);
    } catch(e) {
      reportException(e);
      return;
    }
  }
  console.log("Exception", e);
  document.body.innerHTML = ""
  const pre = document.createElement("pre");
  pre.textContent += "Please copy the text of this error and report it to beta@dicekeys.com." + "\n\n" ;
  if (typeof e === "object" && e instanceof Error) {
    pre.textContent += e.name + "\n\n" + e.message + "\n\n" + e.stack ?? "no stack found";
  } else if (typeof e === "object" && e != null) {
    pre.textContent += Object.prototype.toString.call(e).slice(8, -1) + e.toString() + JSON.stringify(e)
  } else {
    pre.textContent += JSON.stringify(e);
  }
  document.body.appendChild(pre)
}