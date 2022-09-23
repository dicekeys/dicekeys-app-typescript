export type OperatingSystemName =
  "Android" | "ChromeOS" | "iOS" | "MacOS" | "Windows" | "Linux";

export type AppStoreName =
  "Microsoft" | "Apple" | "GooglePlay" | "MacElectron"

const PlatformOsPrefixPairs: [OperatingSystemName, AppStoreName | undefined, string][] = [
  ["Windows", "Microsoft", "Win"],
  ["Android", "GooglePlay", "Android"],
  ["MacOS", "MacElectron", "Mac"],
  ["iOS", "Apple", "iP"], // iPhone, iPad
]

const UserAgentOsRegExpPairs: [OperatingSystemName, AppStoreName | undefined, RegExp][] = [
  ["Windows", "Microsoft", /(Windows*|Windows*)/],
  ["Android", "GooglePlay", /Android/],
  ["iOS", "Apple", /(iPhone|iPad|iPod)/],
  ["MacOS", "MacElectron", /(Mac OS|MacIntel)/],
  ["ChromeOS", "GooglePlay", /CrOS/],
  // Always place Linux at the end of the list
  // as other operating systems (ChromeOS) are built
  // on top of it.
  ["Linux", undefined, /(Linux|X11)/],
  // no app store, so no reason to detect 
  //  ["Open BSD", /OpenBSD/],
];

const navigatorPlatformName = navigator.platform;
const navigatorUserAgent = navigator.userAgent;

const OperatingSystemNameAndAppStoreNamePair  =
  PlatformOsPrefixPairs.find(
    ([/*osName*/, /*appStoreName*/, prefix]) => navigatorPlatformName.startsWith(prefix)
  ) ??
  // Test for match in navigatorUserAgent
  UserAgentOsRegExpPairs.find(
    ([/*osName*/, /*appStoreName*/, regExp]) => regExp.test(navigatorUserAgent)
  ) ??
  [];

export const OperatingSystemName: OperatingSystemName | undefined = OperatingSystemNameAndAppStoreNamePair[0];
export const AppStoreName: AppStoreName | undefined = OperatingSystemNameAndAppStoreNamePair [1];