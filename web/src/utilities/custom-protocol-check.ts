// Ported to typescript from the npm custom-protocol-check pacakge

const userAgentLc = window.navigator.userAgent.toLocaleLowerCase();

const userAgentContains = (mixedCaseString: string) =>
  userAgentLc.indexOf(mixedCaseString.toLowerCase()) > -1;

function isOSX() {
  return userAgentContains("Macintosh");
};

function isFirefox() {
  return userAgentContains("firefox");
}

// function isInternetExplorer() {
//   return userAgentContains("trident");
// }

/**
 * Detects IE 11 and older
 * @return {Boolean} Returns true when IE 11 and older
 */
function isIE() {
    // Test values.
    // Uncomment to check result

    // IE 10
    // ua = 'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; Trident/6.0)';

    // IE 11
    // ua = 'Mozilla/5.0 (Windows NT 6.3; Trident/7.0; rv:11.0) like Gecko/20100101 Firefox/12.0';

    var msie = userAgentLc.indexOf("msie");
    if (msie > 0) {
      // IE 10 or older
      return true;
    }

    var trident = userAgentLc.indexOf("trident/");
    if (trident > 0) {
      // IE 11
      return true;
    }

    // other browser
    return false;
  }

function isEdge() {
  // Test values.
  // Uncomment to check result

  // Edge
  // ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.10240';

  var edge = userAgentLc.indexOf("edge");
  if (edge > 0) {
    return true;
  }

  return false;
}

function isChrome() {
  // IE11 returns undefined for window.chrome
  // and new Opera 30 outputs true for window.chrome
  // but needs to check if window.opr is not undefined
  // and new IE Edge outputs to true for window.chrome
  // and if not iOS Chrome check
  const isChromium = "chrome" in window;
  const winNav = window.navigator;
  const vendorName = winNav.vendor;
  const isOpera = "opr" in window;
  const isIEedge = winNav.userAgent.indexOf("Edge") > -1;
  const isIOSChrome = winNav.userAgent.match("CriOS");
  return (
    (isChromium !== null &&
      typeof isChromium !== "undefined" &&
      vendorName === "Google Inc." &&
      isOpera === false &&
      isIEedge === false) ||
    isIOSChrome
  );
}

// function isOpera() {
//   return userAgentContains(" OPR/");
// }

const registerEvent = (target: HTMLElement | Window, ...[eventType, cb]: Parameters<HTMLElement["addEventListener"]>) => {
  target.addEventListener(eventType, cb);
  return {
    remove: function() {
      target.removeEventListener(eventType, cb);
    }
  };
};

const createHiddenIframe = (target: HTMLElement, uri: string) => {
  const iframe = document.createElement("iframe");
  iframe.src = uri;
  iframe.id = "hiddenIframe";
  iframe.style.display = "none";
  target.appendChild(iframe);

  return iframe;
};

// let DEFAULT_CUSTOM_PROTOCOL_FAIL_CALLBACK_TIMEOUT: number = 2000;

const openUriWithHiddenFrame = (uri: string, failCb: () => void, successCb: () => void, callbackTimeoutInMs: number) => {
  const timeout = setTimeout(function() {
    failCb();
    handler.remove();
  }, callbackTimeoutInMs);

  const iframe = document.querySelector("#hiddenIframe") as HTMLIFrameElement ??
    createHiddenIframe(document.body, "about:blank");

  const onBlur = () => {
    clearTimeout(timeout);
    handler.remove();
    successCb();
  };
  const handler = registerEvent(window, "blur", onBlur);

  iframe.contentWindow?.location.assign(uri);
};

const openUriWithTimeoutHack = (uri: string, failCb: () => void, successCb: () => void, callbackTimeoutInMs: number) => {
  const timeout = setTimeout(function() {
    failCb();
    handler.remove();
  }, callbackTimeoutInMs);

  //handle page running in an iframe (blur must be registered with top level window)
  let target = window as Window;
  while (target.parent && target != target.parent) {
    target = target.parent;
  }

  const onBlur = () => {
    clearTimeout(timeout);
    handler.remove();
    successCb();
  };

  const handler = registerEvent(target, "blur", onBlur);

  window.location.href = uri;
};

const openUriUsingFirefox = (uri: string, failCb: () => void, successCb: () => void) => {
  let iframe = document.querySelector("#hiddenIframe") as HTMLIFrameElement ?? 
    createHiddenIframe(document.body, "about:blank");

  try {
    iframe.contentWindow?.location.assign(uri);
    successCb();
  } catch (e) {
    if ((e as {name: string}).name == "NS_ERROR_UNKNOWN_PROTOCOL") {
      failCb();
    }
  }
};

const getBrowserVersion = () => {
  const ua = window.navigator.userAgent;
  let tem,
    M: RegExpMatchArray =
      ua.match(
        /(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i
      ) || [];
  if (/trident/i.test(M[1] ?? "")) {
    tem = /\brv[ :]+(\d+)/g.exec(ua) || [];
    return parseFloat(tem[1] ?? "") || "";
  }
  if (M[1] === "Chrome") {
    tem = ua.match(/\b(OPR|Edge)\/(\d+)/);
    if (tem != null) {
      return parseFloat(tem[2] ?? "");
    }
  }
  M = M[2]
    ? [M[1], M[2]] as RegExpMatchArray
    : [window.navigator.appName, window.navigator.appVersion, "-?"] as RegExpMatchArray;
  if ((tem = ua.match(/version\/(\d+)/i)) != null) M.splice(1, 1, tem[1] ?? "");
  return parseFloat(M[1] ?? "");
};

export const customProtocolCheck = (
  uri: string,
  failCb: () => void,
  successCb: () => void,
  callbackTimeoutInMs: number = 2000,
  unsupportedCb?: () => void
) => {
  const failCallback = () => {
    failCb && failCb();
  };

  const successCallback = () => {
    successCb && successCb();
  };

  const unsupportedCallback = () => {
    unsupportedCb && unsupportedCb();
  };

  const openUri = (callbackTimeoutInMs: number) => {
    if (isFirefox()) {
      const browserVersion = getBrowserVersion();
      if (browserVersion >= 64) {
        openUriWithHiddenFrame(uri, failCallback, successCallback, callbackTimeoutInMs);
      } else {
        openUriUsingFirefox(uri, failCallback, successCallback);
      }
    } else if (isChrome()) {
      openUriWithTimeoutHack(uri, failCallback, successCallback, callbackTimeoutInMs);
    } else if (isOSX()) {
      openUriWithHiddenFrame(uri, failCallback, successCallback, callbackTimeoutInMs);
    } else {
      //not supported, implement please
      unsupportedCallback();
    }
  };

  if (isEdge() || isIE() && "msLaunchUri" in navigator) {
    //for IE and Edge in Win 8 and Win 10
    (navigator as any).msLaunchUri(uri, successCb, failCb);
  } else {
    if (document.hasFocus()) {
      openUri(callbackTimeoutInMs);
    } else {
      const focusHandler = registerEvent(window, "focus", () => {
        focusHandler?.remove();
        openUri(callbackTimeoutInMs);
      });
    }
  }
};
