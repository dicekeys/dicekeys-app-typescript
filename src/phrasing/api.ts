import {
  ApiStrings,
  Exceptions
} from "@dicekeys/dicekeys-api-js"


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

export const describeCommandsAction = (
  command: ApiStrings.Command,
  areDerivationOptionsSigned: boolean
): string => {
  const createOrRecreate = areDerivationOptionsSigned ?
    "recreate" : "create";
  switch (command) {
    case "getSecret":
      return areDerivationOptionsSigned ?
        `re-create a secret that your previously created for it` :
        `create a secret`;
    case "getSealingKey":
      return `${createOrRecreate} a key for protecting its secrets (a sealing key)`;
    case "getUnsealingKey":
      return `${createOrRecreate} a key for decoding its protected secrets (an unsealing key)`;
    case "getSignatureVerificationKey":
      return `${createOrRecreate} a key which others can use to verify which messages it has approved (a signature-verification key)`;
    case "getSymmetricKey":
      return `${createOrRecreate} a key for encoding and decoding its own secrets (a symmetric Key)`;
    case "generateSignature":
      return `approve a message or other data`;
    case "getSigningKey":
      return `${createOrRecreate} a key for approving messages or other data (a signing Key)`;
    case "sealWithSymmetricKey":
      return `protect its secret data (sealing that data with a symmetric key)`;
    case "unsealWithSymmetricKey":
      return `access its secret data (unsealing that data with a symmetric key)`;
    case "unsealWithUnsealingKey":
      return `access its secret data (unsealing that data with an unsealing key)`;
    case "getAuthToken":
//    default:
        throw new Exceptions.InvalidCommand("Invalid API Command: " + command);
  }
}

export const describeHost = (host: string): string => {
  const knownHost = getKnownHost(host);
  return (knownHost != null) ?
    knownHost :
    `The website at "${host}"`;
}

export const describeCommand = (
  command: ApiStrings.Command,
  host: string,
  areDerivationOptionsSigned: boolean
//  derivationOptionsObjOrJson: DerivationOptions | string
//  const derivationOptions = DerivationOptions(derivationOptionsObjOrJson);
): string => `${
      describeHost(host)
    } wants you to use your DiceKey to ${
      describeCommandsAction(command, areDerivationOptionsSigned)
    }.`;

export const describeDiceKeyAccessRestritions = (host: string): string =>
  `${describeHost(host)} will not get to see your DiceKey.`;

