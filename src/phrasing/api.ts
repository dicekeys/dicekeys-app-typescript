import styles from "./api.module.css"
import {
  ApiCalls, Exceptions
} from "@dicekeys/dicekeys-api-js"
import {
  Appendable,
  MonospaceSpan,
  Span,
} from "../web-component-framework";
import { DICEKEY } from "~web-components/dicekey-styled";


const knownHostSuffixes: [string, string][] = [
  ["1password.com", "1Password"],
  ["bitwarden.com", "Bitwarden"],
  ["authy.com", "Authy"],
  ["keepersecurity.com", "Keeper Security"],
  ["keepersecurity.eu", "Keeper Security"],
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


export const describeHost = (host: string): Appendable => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ?
      Span({class: styles.known_application_name, text: knownHost}) :
      // [//`The website at `,
      MonospaceSpan().setInnerText(host)
      //]
  ;
}

export const shortDescribeCommandsAction = (
  command: ApiCalls.Command,
): string => {
  switch (command) {
    case "getPassword":
      return `Send Password`;
    case "getSecret":
      return `Send Secret`;
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
  command: ApiCalls.Command,
  host: string,
  areDerivationOptionsSigned: boolean
): Appendable => {
  const createOrRecreate = areDerivationOptionsSigned ?
    "recreate" : "create";
  const hostComponent = describeHost(host);
  // use your DiceKey to 
  switch (command) {
    case "getPassword":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to ${createOrRecreate} a password?`];
    case "getSecret":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to ${createOrRecreate} a secret security code?`];
    case "getUnsealingKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to ${createOrRecreate} keys to encode and decode secrets?`];
    case "getSymmetricKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to a ${createOrRecreate} key to encode and decode secrets?`];
    case "sealWithSymmetricKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to encode a secret?`];
    case "unsealWithSymmetricKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to allow to decode a secret?`];
    case "unsealWithUnsealingKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to allow to decode a secret?`];
    // Less common
    case "getSigningKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to ${createOrRecreate} keys to sign data?`];
    case "generateSignature":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to add its digital signature to data?`];
    case "getSignatureVerificationKey":
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to ${createOrRecreate} a key used to verify data it has signed?`];
      // Uncommon
    case "getSealingKey": 
      return [`May&nbsp;`, hostComponent, `&nbsp;use your `, DICEKEY(), ` to ${createOrRecreate} keys to store secrets?`];
    // Never
    // default:
    //     throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
  }
}


export const describeRequestChoice = describeCommandsAction; 

export const describeDiceKeyAccessRestrictions = (host: string): Appendable => ([
    `(`,
    describeHost(host),
    ` will not see your `, DICEKEY(),
    `.)`
  ]);



// Add a hint for when you need to find the same DiceKey to [re-generate this [key|secret] [unseal this message].
export const describeHintPurpose = (
  command: ApiCalls.Command
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
