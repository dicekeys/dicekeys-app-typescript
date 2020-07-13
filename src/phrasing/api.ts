import {
  ApiStrings
} from "@dicekeys/dicekeys-api-js"
import {
  Appendable
} from "../web-components/html-component";
import {
  MonospaceSpan,
  Span,
} from "../web-components/html-components";


const knownHostSuffixes: [string, string][] = [
  ["1password.com", "1Password"],
  ["bitwarden.com", "BitWarden"]
];
const getKnownHost = (host:string): string | undefined => {
  const hostLc = host.toLowerCase();
  for (const [suffix, name] of knownHostSuffixes) {
    if (hostLc.endsWith(suffix)) {
      return name;
    }
  }
  return undefined;
}

// type DerivableObject = DerivableObjectName  | "SealingKey" | "SignatureVerificationKey";
// type KeyName = Exclude<DerivableObject, "Secret">;

// export const commandToDerivableObjectType = (
//   command: ApiStrings.Command
// ): DerivableObject => {
//   switch (command) {
//     case "getSecret":
//       return DerivableObjectNames.Secret
//     case "getSealingKey":
//       return "SealingKey"
//     case "getUnsealingKey":
//       return DerivableObjectNames.UnsealingKey
//     case "getSignatureVerificationKey":
//       return "SignatureVerificationKey"
//     case "getSymmetricKey":
//       return DerivableObjectNames.SymmetricKey
//     case "generateSignature":
//       return DerivableObjectNames.SigningKey
//     case "getSigningKey":
//       return DerivableObjectNames.SigningKey
//     case "sealWithSymmetricKey":
//       return DerivableObjectNames.SymmetricKey
//     case "unsealWithSymmetricKey":
//       return DerivableObjectNames.SymmetricKey
//     case "unsealWithUnsealingKey":
//       return DerivableObjectNames.UnsealingKey
//     case "getAuthToken":
// //    default:
//         throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
//   }
// }

// const getPurposeForKey = (
//   derivableObject: DerivableObjectName
// ) => {

// }


export const describeHost = (host: string): Appendable => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ?
      Span().with( e => e.primaryElement.style.setProperty("font-style", "italic") ).setInnerText(knownHost) :
      // [//`The website at `,
      MonospaceSpan().setInnerText(host)
      //]
  ;
}

export const describeCommandsAction = (
  command: ApiStrings.Command,
  host: string,
  areDerivationOptionsSigned: boolean
): Appendable => {
  const createOrRecreate = areDerivationOptionsSigned ?
    "recreate" : "create";
  const hostComponent = describeHost(host);
  // use your DiceKey to 
  switch (command) {
    case "getPassword":
      return [`Do you want your DiceKey to ${createOrRecreate} a password for `, hostComponent, `?`];
    case "getSecret":
      return [`Do you want your DiceKey to ${createOrRecreate} a secret security code for `, hostComponent, `?`];
    case "getUnsealingKey":
      return [`Do you want your DiceKey to ${createOrRecreate} keys for `, hostComponent, ` to encode and decode secrets?`];
    case "getSymmetricKey":
      return [`Do you want your DiceKey to ${createOrRecreate} keys for `, hostComponent, ` to encode and decode secrets?`];
    case "sealWithSymmetricKey":
      return [`Do you want your DiceKey to encode secrets so that they can only be read by`, hostComponent, `?`];
    case "unsealWithSymmetricKey":
      return [`Do you want your DiceKey to allow `, hostComponent, ` to decode its secrets?`];
    case "unsealWithUnsealingKey":
      return [`Do you want your DiceKey to allow `, hostComponent, ` to decode its secrets?`];
    // Less common
    case "getSigningKey":
      return [`Do you want your DiceKey to ${createOrRecreate} keys for `, hostComponent, ` to sign data?`];
    case "generateSignature":
      return [`Do you want your DiceKey to sign data on behalf of `, hostComponent, `?`];
    case "getSignatureVerificationKey":
      return [`Do you want your DiceKey to ${createOrRecreate} a key used to verify data signed by `, hostComponent, `?`];
      // Uncommon
    case "getSealingKey": 
    return [`Do you want your DiceKey to ${createOrRecreate} keys for `, hostComponent, ` to store secrets?`];
    // Never
    // default:
    //     throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
  }
}


export const describeRequestChoice = describeCommandsAction; 
// (
//   command: ApiStrings.Command,
//   host: string,
//   areDerivationOptionsSigned: boolean
// //  derivationOptionsObjOrJson: DerivationOptions | string
// //  const derivationOptions = DerivationOptions(derivationOptionsObjOrJson);
// ): Appendable => ([
//   "Allow ",
//   describeHost(host),
//   ` to use your DiceKey to ${describeCommandsAction(command, areDerivationOptionsSigned)}?`
// ]);


export const describeDiceKeyAccessRestrictions = (host: string): Appendable => ([
    `(`,
    describeHost(host),
    ` will not see your DiceKey.)`
  ]);



// Add a hint for when you need to find the same DiceKey to [re-generate this [key|secret] [unseal this message].
export const describeHintPurpose = (
  command: ApiStrings.Command
): string | undefined => {
  switch (command) {
    case "getPassword":
      return `recreate this password`;
    case "getSecret":
      return `recreate this secret`;
    case "getSealingKey":
      return `decode secrets`;
    case "getUnsealingKey":
      return `recreate this key`;
    case "getSignatureVerificationKey":
      return `create the key to sign data`;
    case "getSymmetricKey":
      return `recreate this key`;
    case "generateSignature":
      return `recreate the key used to create this signature`;
    case "getSigningKey":
      return `recreate this key`;
    case "sealWithSymmetricKey":
      return `decode secrets or encode more secrets`;
    case "unsealWithSymmetricKey":
    case "unsealWithUnsealingKey":
      return undefined;
  }
}
