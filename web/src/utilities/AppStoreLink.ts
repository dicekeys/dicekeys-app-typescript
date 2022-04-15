import {AppStoreName} from "./OperatingSystemAndAppStoreName"
import {BUILD_VERSION} from "../vite-build-constants";

export const AppStoreLink = (()=>{
  switch (AppStoreName) {
    case "Apple":
      return "https://apps.apple.com/us/app/dicekeys/id1545123216";
    case "GooglePlay":
      return `https://play.google.com/store/apps/details?id=com.dicekeys.app`;
    case "Microsoft":
      return `https://github.com/dicekeys/dicekeys-app-typescript/releases/download/v${BUILD_VERSION}/DiceKeys.Setup.${BUILD_VERSION}.exe`;
    default: return;
  }
})();

export const downloadOrNavigateToAppStore = () => {
  if (AppStoreLink == null) return;
  if (AppStoreName === "Microsoft") {
    // We have an EXE to download directly, so do that.
    window.location.assign(AppStoreLink);
  } else {
    // We need to open a window for the app store
    window.open(AppStoreLink, '_blank')?.focus();
  }
}