import {
  ApiCalls, Exceptions
} from "@dicekeys/dicekeys-api-js"


const knownHostSuffixes: [string, string][] = [
  ["1password.com", "1Password"],
  ["bitwarden.com", "Bitwarden"],
  ["authy.com", "Authy"],
  ["keepersecurity.com", "Keeper Security"],
  ["keepersecurity.eu", "Keeper Security"],
  ["lastpass.com", "LastPass"],
  ["localhost", "your password manager"]
];

export const getKnownHost = (host:string): string | undefined => {
  const hostLc = host.toLowerCase();
  for (const [suffix, name] of knownHostSuffixes) {
    if (hostLc.endsWith(suffix)) {
      return name;
    }
  }
  return undefined;
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
