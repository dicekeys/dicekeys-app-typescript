
// import { DiceKey } from "../../dicekeys/DiceKey";
// import { NavigationPathState } from "../../state/core/NavigationPathState";
// import { ViewState } from "../../state/core/ViewState";

// const SecretSharingStateName = "SecretSharingState" as const;
// export class BackupViewState implements ViewState<typeof SecretSharingStateName> {
//   readonly viewName = SecretSharingStateName;
//   navState: NavigationPathState;
//   constructor(
//     parentNavState: NavigationPathState,
//     readonly withDiceKey?: DiceKey,
// 		readonly 
//   ) {
//     this.navState = new NavigationPathState(parentNavState, SecretSharingStateName, () => this.step != BackupStep.START_INCLUSIVE ? this.step.toString() : "");
//     this.validationStepViewState = new ValidateBackupViewState(this.withDiceKey);
//     makeAutoObservable(this);
//   }
// }