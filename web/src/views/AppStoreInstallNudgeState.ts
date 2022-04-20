import { action, makeAutoObservable } from "mobx";
import { ObservableLocalStorageBoolean } from "../state/core/ObservableLocalStorage";
import { AppStoreName, OperatingSystemName } from "../utilities/OperatingSystemAndAppStoreName";
import { RUNNING_IN_BROWSER } from "../utilities/is-electron";
import { downloadOrNavigateToAppStore } from "../utilities/AppStoreLink";

export class AppStoreInstallNudgeStateClass {
  readonly userAskedToPermanentlyDismissTheInstallNudge = new ObservableLocalStorageBoolean("PermanentlyDismissInstallNudge");

  private _dontShowAgainCheckboxIsChecked: boolean = false;
  get dontShowAgainCheckboxIsChecked() { return this._dontShowAgainCheckboxIsChecked }
  setDontShowAgainCheckboxIsChecked = action( (newValue: boolean) => {
    this._dontShowAgainCheckboxIsChecked = newValue;
  });
  toggleDontShowAgainCheckboxIsChecked = () => this.setDontShowAgainCheckboxIsChecked(!this.dontShowAgainCheckboxIsChecked);

  private _userAskedToDismissTheInstallNudgeForThisSession: boolean = false;
  get userAskedToDismissTheInstallNudgeForThisSession() { return this._userAskedToDismissTheInstallNudgeForThisSession }
  get appStoreName() { return AppStoreName }
  get osName() { return OperatingSystemName }
  get showInstallNudge(): boolean {
    // Show the install nudge if...
    return true &&
      // we're running in a browser (not in the electron app),
      RUNNING_IN_BROWSER &&
      // the browser is running on a platform associated with an app store,
      this.appStoreName != null &&
      // the user hasn't dismissed the install nudge yet this session, and
      !this.userAskedToDismissTheInstallNudgeForThisSession &&
      // and the user hasn't permanently dismissed this nudge
      !this.userAskedToPermanentlyDismissTheInstallNudge.value
  }

  private dismissTheInstallNudgeForThisSession = action( () => {
    this._userAskedToDismissTheInstallNudgeForThisSession = true;
  });

  dismissTheInstallNudge = () => {
    this.dismissTheInstallNudgeForThisSession();
    if (this.dontShowAgainCheckboxIsChecked) {
      this.userAskedToPermanentlyDismissTheInstallNudge.setTrue();
    }
  };

  install = () => {
    this.dismissTheInstallNudge();
    downloadOrNavigateToAppStore();
  }

  constructor() {
    makeAutoObservable(this);
  }
}

export const AppStoreInstallNudgeState = new AppStoreInstallNudgeStateClass();
export type AppStoreInstallNudgeState = typeof AppStoreInstallNudgeState;