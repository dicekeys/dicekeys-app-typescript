// derived from http://jsfiddle.net/ChristianL/AVyND/
const osTable: [string, RegExp][] = [
  ['Windows 10', /(Windows 10.0|Windows NT 10.0)/],
  ['Windows 8.1', /(Windows 8.1|Windows NT 6.3)/],
  ['Windows 8', /(Windows 8|Windows NT 6.2)/],
  ['Windows 7', /(Windows 7|Windows NT 6.1)/],
  ['Windows Vista', /Windows NT 6.0/],
  ['Windows Server 2003', /Windows NT 5.2/],
  ['Windows XP', /(Windows NT 5.1|Windows XP)/],
  ['Windows 2000', /(Windows NT 5.0|Windows 2000)/],
  ['Windows ME', /(Win 9x 4.90|Windows ME)/],
  ['Windows 98', /(Windows 98|Win98)/],
  ['Windows 95', /(Windows 95|Win95|Windows_95)/],
  ['Windows NT 4.0', /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/],
  ['Windows CE', /Windows CE/],
  ['Windows 3.11', /Win16/],
  ['Android', /Android/],
  ['Open BSD', /OpenBSD/],
  ['Sun OS', /SunOS/],
  ['Chrome OS', /CrOS/],
  ['Linux', /(Linux|X11(?!.*CrOS))/],
  ['iOS', /(iPhone|iPad|iPod)/],
  ['Mac OS X', /Mac OS X/],
  ['Mac OS', /(Mac OS|MacPPC|MacIntel|Mac_PowerPC|Macintosh)/],
  ['QNX', /QNX/],
  ['UNIX', /UNIX/],
  ['BeOS', /BeOS/],
  ['OS/2', /OS\/2/],
  ['Search Bot', /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/]
];

const browsers: {searchKey: string, name?: string}[] = [
  {searchKey: "Chrome"},
  {searchKey: "Safari"},
  {searchKey: "Firefox"},
  {searchKey: "Opera"},
  {searchKey: "Brave"},
  {searchKey: "OPR", name: "Opera"},
  {searchKey: "Edge", name: "Edge (pre-chromium)"},
  {searchKey: "Edg", name: "Edge (chromium-based)"},
  {searchKey: "MSIE", name: "Internet Explorer"},
  {searchKey: "Trident/", name: "Internet Explorer"},
];

const getBrowserInfo = () => {
  const screenSize = {
    width: screen?.width,
    height: screen?.height
  } 

  // browser
  const appVersion = navigator.appVersion;
  const userAgent = navigator.userAgent;
  const appName = navigator.appName;
  var browser : string = "";
  var browserVersion : string = "";

  const browserEntry = browsers.find( b => userAgent.indexOf(b.searchKey) != -1);
  if (browserEntry) {
    const {searchKey, name = searchKey} = browserEntry;
    const indexOfSearchKey = userAgent.indexOf(searchKey)
    if (indexOfSearchKey >= 0) {
      browser = name;
      const indexOfVersion = userAgent.indexOf("Version");
      browserVersion = userAgent.substr( (indexOfVersion > indexOfSearchKey) ?
        // The version is prefaced by "Version "
        (indexOfVersion + "Version ".length) :
        // The version follows the browser name and a space
        (indexOfSearchKey + searchKey.length + 1)
      );
    }
  } else {
    const nameOffset = userAgent.lastIndexOf(' ') + 1;
    const verOffset = userAgent.lastIndexOf('/');
    if (nameOffset < verOffset) { 
      browser = userAgent.substring(nameOffset, verOffset - nameOffset);
      browserVersion = userAgent.substring(verOffset + 1);
    } else {
      browser = appName;
      browserVersion = appVersion;
    }
  }

  for (const delimiter of [';', ' ', ')']) {
    const delimiterIndex = browserVersion.indexOf(delimiter); 
    if (delimiterIndex >= 0) {
      browserVersion = browserVersion.substr(0, delimiterIndex);
    }     
  }

  var browserMajorVersion = parseInt('' + browserVersion, 10);
  if (isNaN(browserMajorVersion)) {
    browserVersion = '' + parseFloat(appVersion);
    browserMajorVersion = parseInt(appVersion, 10);
  }

  // mobile version
  const mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(appVersion);

  // system
  const osTableEntry = osTable.find( ([_, regExp]) => regExp.test(userAgent) );
  var os: string = osTableEntry ? osTableEntry[0] : "";

  var osVersion: string = "";
  if (/Windows/.test(os)) {
      osVersion = /Windows (.*)/.exec(os)?.[1] ?? "";
      os = 'Windows';
  } else {
    switch (os) {
      case 'Mac OS':
      case 'Mac OS X':
      case 'Android':
        osVersion = (/(?:Android|Mac OS|Mac OS X|MacPPC|MacIntel|Mac_PowerPC|Macintosh) ([\.\_\d]+)/.exec(userAgent)?.[1]) ?? "";
        break;

      case 'iOS':
        const osVersionParts = (/OS (\d+)_(\d+)_?(\d+)?/.exec(appVersion));
        osVersion = osVersionParts?.[1] + '.' + osVersionParts?.[2] + '.' + (osVersionParts?.[3] ?? "0");
        break;
    }
  }

  return {
    os,
    osVersion,
    browser,
    browserVersion,
    browserMajorVersion,
    screenSize,
    mobile,
  };
};
export const browserInfo = getBrowserInfo();