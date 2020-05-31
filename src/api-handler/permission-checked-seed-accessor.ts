import {
  ApiPermissionChecks
} from "./permission-checks";
import {
  DiceKey
} from "../dicekeys/dicekey";
import {
  AuthenticationRequirements,
  RequestForUsersConsent,
  UnsealingInstructions,
  UsersConsentResponse
} from "../api/unsealing-instructions";
import {
  DerivableObjectNames,
  DerivationOptions,
  DerivableObjectName
} from "../api/derivation-options";
import {
  PackagedSealedMessage,
  Secret,
  SealingKey,
  SignatureVerificationKey,
  SigningKey,
  SymmetricKey,
  UnsealingKey
} from "@dicekeys/seeded-crypto-js";
import {
  diceKeyAppStateStore
} from "./app-state-dicekey"

export class ClientMayNotRetrieveKeyException extends Error {
  constructor(public readonly type: DerivableObjectName) {
    super(`DiceKeys will only return a key of type ${type} if the derivation options set clientMayRetrieveKey to true.`)
  }
}

/**
 * This class abstracts away all permissions checks AND all access to the keySqr seed,
 * so that the only way the API which inherits from it can get to the seed is by
 * going through the permission checks.
 */
export class PermissionCheckedSeedAccessor{
  private readonly permissionChecks: ApiPermissionChecks;

  constructor(
    respondToUrl: string,
    handshakeAuthenticatedUrl: string | undefined,
    private loadDiceKey: () => Promise<DiceKey>,
    requestUsersConsent: (
      requestForUsersConsent: RequestForUsersConsent
    ) => Promise<UsersConsentResponse>
  ) {
    this.permissionChecks = new ApiPermissionChecks(
        respondToUrl,
        handshakeAuthenticatedUrl,
        requestUsersConsent
      )
  }

  private getDiceKeyAsync = async (): Promise<DiceKey> =>
    diceKeyAppStateStore.diceKey ||
    diceKeyAppStateStore.setDiceKey( await this.loadDiceKey() )


  /**
   * Request a seed generated from the user's DiceKey and salted by the
   * derivationOptionsJson string, using the DerivationOptions
   * specified by that string. Implements guards to ensure that the
   * keyDerivationOptionsJson allow the client application with the
   * requester's package name to perform operations with this key.
   */
  public getSeedOrThrowIfClientNotAuthorizedAsync = async (
    derivationOptionsObjectOrJson: string | DerivationOptions | undefined,
    derivableObjectType: DerivableObjectName
  ): Promise<string> => {
    const derivationOptions = DerivationOptions(derivationOptionsObjectOrJson, derivableObjectType);

    this.permissionChecks.throwIfClientNotAuthorized(derivationOptions)
    const diceKey = await this.getDiceKeyAsync();
    const preCanonicalDiceKey: DiceKey =  (derivationOptions.excludeOrientationOfFaces) ?
      DiceKey.removeOrientations(diceKey) :
      diceKey;
    const canonicalDiceKey = DiceKey.rotateToRotationIndependentForm(preCanonicalDiceKey); 
    const humanReadableForm = DiceKey.toHumanReadableForm(canonicalDiceKey);
    return humanReadableForm;
  }


  /**
   * Used to guard calls to the unseal operation of SymmetricKey and PrivateKey,
   * which not only needs to authorize via derivationOptionsJson, but
   * also the postDecryptionOptions in PackagedSealedMessage
   *
   * Requests a seed generated from the user's DiceKey and salted by the
   * derivationOptionsJson string, using the DerivationOptions
   * specified by that string. Implements guards to ensure that the
   * keyDerivationOptionsJson allow the client application with the
   * requester's package name to perform operations with this key.
   */
  public getSeedOrThrowIfClientNotAuthorizedToUnsealAsync = async (
    packagedSealedMessage: PackagedSealedMessage,
    type: DerivableObjectName
   ): Promise<string> => {
    this.permissionChecks.throwIfUnsealingInstructionsViolatedAsync(packagedSealedMessage.unsealingInstructions)
    return await  this.getSeedOrThrowIfClientNotAuthorizedAsync(
      packagedSealedMessage.derivationOptionsJson, type
    )
  }

  /**
   * Requests a seed generated from the user's DiceKey and salted by the
   * derivationOptionsJson string, using the DerivationOptions
   * specified by that string. Implements guards to ensure that the
   * keyDerivationOptionsJson allow the client application with the
   * requester's package name to perform operations with this key.
   *
   * This is used to guard calls to APIs calls used to return raw non-public
   * keys: PrivateKey, SigningKey, or SymmetricKey. The specification only
   * allows the DiceKeys app to return these keys to the requesting app
   * if the derivationOptionsJson has `"clientMayRetrieveKey": true`.
   */
  public getSeedOrThrowIfClientsMayNotRetrieveKeysOrThisClientNotAuthorizedAsync = async (
    derivationOptionsJson: DerivationOptions | string | undefined,
    type: DerivableObjectName
  ) : Promise<string> => {
    const derivationOptions = DerivationOptions(derivationOptionsJson);
    const {clientMayRetrieveKey} = derivationOptions;
    if (!clientMayRetrieveKey) {
      throw new ClientMayNotRetrieveKeyException(type)
    }
    return await this.getSeedOrThrowIfClientNotAuthorizedAsync(derivationOptions, type)
  }
}