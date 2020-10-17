//import style from "../demo.module.css";
import {
  Observable,
  // Div
} from "../../../web-component-framework";
import { CommandSimulator } from "../command-simulator";
import { //FnCall, 
  Formula,
  //FormulaInputVariable, Instructions, ParameterCard,
  //ResultTextBlock
} from "../basic-api-demo-components";
import {
  MultiCommandSimulatorOptions,
  MultiCommandSimulator
} from "./multi-command-simulator";

export class SymmetricKeySealAndUnseal extends MultiCommandSimulator<MultiCommandSimulatorOptions> {
  packagedSealedMessageJson = new Observable<string | undefined>();

  render() {
    const baseInputs = {
      authorizedDomains: this.options.authorizedDomains,
      seedString: this.seedString,
      respondTo: this.respondTo,
    }
    super.render(
      new CommandSimulator({
        command: "sealWithSymmetricKey",
        inputs: {
          ...baseInputs
        },
        outputs: {
          packagedSealedMessageJson: this.packagedSealedMessageJson
        }
      }),
      new CommandSimulator({
        command: "unsealWithSymmetricKey",
        inputs: {
          packagedSealedMessageJson: {
            formula: Formula("packagedSealedMessageJson", "string"),//, FormulaInputVariable({}, "packagedSealedMessage"), "(returned by sealWithSymmetricKey"),
            prescribed: this.packagedSealedMessageJson,
            usePrescribed: true
          },
          ...baseInputs
        }
      }),
    );
  }
}
