import {DerivationOptions as CryptoDerivationOptions} from "@dicekeys/seeded-crypto-js";

export const DerivableObjectNames = {
  "Secret": "Secret",
  "SigningKey": "SigningKey",
  "SymmetricKey": "SymmetricKey",
  "UnsealingKey": "UnsealingKey"
} as const;
export type DerivableObjectName = keyof typeof DerivableObjectNames;
  
  
export interface AuthenticationRequirements {
  /**
   * On Apple platforms, applications are specified by a URL containing a domain name
   * from the Internet's Domain Name System (DNS).
   *
   * If this value is specified, applications must come from clients that have a URL prefix
   * starting with one of the items on this list if they are to use a derived key.
   *
   * Since some platforms, including iOS, do not allow the DiceKeys app to authenticate
   * the sender of an API request, the app may perform a cryptographic operation
   * only if it has been instructed to send the result to a URL that starts with
   * one of the permitted prefixes.
   */
  urlPrefixesAllowed?: string[];

  /**
   * When set, clients will need to issue a handshake request to the API,
   * and receive an authorization token (a random shared secret), before
   * issuing other requests where the URL at which they received the token
   * starts with one of the authorized prefixes.
   * 
   * The DiceKeys app will map the authorization token to that URL and,
   * when reqeusts include that token, validate that the URL associated
   * with the token has a valid prefix. The DiceKeys app will continue to
   * validate that responses are also sent to a valid prefix. 
   *
   */
  requireAuthenticationHandshake?: boolean;

  
  /**
   * In Android, client applications are identified by their package name,
   * which must be cryptographically signed before an application can enter the
   * Google play store.
   *
   * If this value is specified, Android apps must have a package name that begins
   * with one of the provided prefixes if they are to use a derived key.
   *
   * Note that all prefixes, and the client package names they are compared to,
   * have an implicit '.' appended to to prevent attackers from registering the
   * suffix of a package name.  Hence the package name "com.example.app" is treated
   * as "com.example.app." and the prefix "com.example" is treated as
   * "com.example." so that an attacker cannot generate a key by registering
   * "com.examplesignedbyattacker".
   */
  androidPackagePrefixesAllowed?: string[];
}

export interface ApiDerivationOptions extends AuthenticationRequirements {
  /**
   * Unless this value is explicitly set to _true_, the DiceKeys may prevent
   * to obtain a raw derived [[SymmetricKey]],
   * [[UnsealingKey]], or
   * [[SigningKey]].
   * Clients may retrieve a derived [[SealingKey]],
   * or [[SignatureVerificationKey]] even if this value
   * is not set or set to false.
   *
   * Even if this value is set to true, requests for keys are not permitted unless
   * the client would be authorized to perform cryptographic operations on those keys.
   * In other words, access is forbidden if the [restrictions] field is set and the
   * specified [Restrictions] are not met.
   */
  clientMayRetrieveKey?: boolean;

  /**
   * When using a DiceKey as a seed, the default seed string will be a 75-character
   * string consisting of triples for each die in canonoical order:
   * 
   *   1 The uppercase letter on the die
   *   2 The digit on the die
   *   3 The orientation relative to the top of the square
   *
   * If  `excludeOrientationOfFaces` is set to `true` set to true,
   * the orientation character (the third member of each triple) will be
   * set to "?" before the canonical form is determined
   * (the choice of the top left corner that results in the human readable
   * form earliest in the sort order) and "?" will be the third character
   * in each triple.
   * 
   * This option exists because orientations may be harder for users to copy correctly
   * than letters and digits are. With this option on, should a user choose to manually
   * copy the contents of a DiceKey and make an error in copying an orientation, that
   * error will not prevent them from re-deriving the specified key or secret.

    */
  excludeOrientationOfFaces?: boolean;
}

export type DerivationOptions = CryptoDerivationOptions & ApiDerivationOptions;

export class InvalidDerivationOptionsTypeFieldException extends Error {
  constructor(
    public typeRequiredByOperation: DerivableObjectName,
    public typeSpecifiedInDerivationOptions: DerivableObjectName
  ) {
    super(`Operation for type ${typeRequiredByOperation} cannot use derivation options with type ${typeSpecifiedInDerivationOptions}.`);
  }
}

export const DerivationOptions = (
  derivationOptionsAsObjectOrJson?: string | DerivationOptions | null,
  typeRequiredByOperation?: DerivableObjectName
): DerivationOptions => {
  const derivationOptions = 
    (typeof derivationOptionsAsObjectOrJson === "object" && derivationOptionsAsObjectOrJson != null) ?
      derivationOptionsAsObjectOrJson :
      JSON.parse(derivationOptionsAsObjectOrJson ?? "{}") as DerivationOptions;
  if (typeRequiredByOperation && derivationOptions.type && derivationOptions.type !== typeRequiredByOperation) {
    throw new InvalidDerivationOptionsTypeFieldException(typeRequiredByOperation, derivationOptions.type);
  }
  return derivationOptions;
}