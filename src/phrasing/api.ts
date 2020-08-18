import {
  ApiStrings, Exceptions
} from "@dicekeys/dicekeys-api-js"
import {
  Appendable,
  MonospaceSpan,
  Span,
} from "../web-component-framework";


const knownHostSuffixes: [string, string][] = [
  ["1password.com", "1Password"],
  ["bitwarden.com", "Bitwarden"],
  ["authy.com", "Authy"],
  ["keepersecurity.com", "Keeper"],
  ["lastpass.com", "LastPass"],
  ["localhost", "your password manager"]
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
      Span({class: "known-application-name", text: knownHost}) :
      // [//`The website at `,
      MonospaceSpan().setInnerText(host)
      //]
  ;
}

export const shortDescribeCommandsAction = (
  command: ApiStrings.Command,
): string => {
  switch (command) {
    case "getPassword":
      return `Send Password`;
    case "getSecret":
      return `Send Sassword`;
    case "getSigningKey":
    case "getSealingKey": 
    case "getUnsealingKey":
      return `Send Keys`;
    case "getSymmetricKey":
    case "getSignatureVerificationKey":
      return `Send Key`;
    case "sealWithSymmetricKey":
      return `Send Encoded Message`;
    case "unsealWithSymmetricKey":
    case "unsealWithUnsealingKey":
      return `Send Encoded Message`;
    default:
        throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
  }
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
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to ${createOrRecreate} a password?`];
    case "getSecret":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to ${createOrRecreate} a secret security code?`];
    case "getUnsealingKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to ${createOrRecreate} keys to encode and decode secrets?`];
    case "getSymmetricKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to a ${createOrRecreate} key to encode and decode secrets?`];
    case "sealWithSymmetricKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to encode a secret?`];
    case "unsealWithSymmetricKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to allow to decode a secret?`];
    case "unsealWithUnsealingKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to allow to decode a secret?`];
    // Less common
    case "getSigningKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to ${createOrRecreate} keys to sign data?`];
    case "generateSignature":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to add its digital signature to data?`];
    case "getSignatureVerificationKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to ${createOrRecreate} a key used to verify data it has signed?`];
      // Uncommon
    case "getSealingKey": 
      return [`May&nbsp;`, hostComponent, `&nbsp;use your DiceKey to ${createOrRecreate} keys to store secrets?`];
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
