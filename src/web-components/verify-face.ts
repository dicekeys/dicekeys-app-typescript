// import {
//   getImageOfFaceRead
// } from "@dicekeys/read-dicekey-js"
import {
  Attributes,
  // ComponentEvent,
  // InputButton, Div, Label, Select, Option, Observable, OptGroup
} from "../web-component-framework";
// import {
//   DiceKeySvg
// } from "./dicekey-svg";
// import {
//   DiceKeyAppState
// } from "../state/app-state-dicekey";
import {
  DiceKey
} from "../dicekeys/dicekey";
// import {
//   passwordConsumers,
//   passwordConsumersGroupedByType
// } from "../dicekeys/password-consumers";
// import {
//   ComputeApiCommandWorker
// } from "../workers/call-api-command-worker";
// import {
//     ApiCalls, ApiStrings
// } from "@dicekeys/dicekeys-api-js";
// import {
//   DisplayPassword
// } from "./password-field"
// import {
//   describePasswordConsumerType
// } from "../phrasing/ui";
// import {
//   FaceRead
// } from "../dicekeys/face-read";
// import {
//   Line,
//   Undoverline
// } from "../dicekeys/undoverline";

export interface DiceKeySvgViewOptions extends Attributes {
  diceKey: DiceKey;
  showOnlyCorners?: boolean;
}
