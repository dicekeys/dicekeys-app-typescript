import {
  AppStateStore,
} from "../web-component-framework/locally-stored-state";
import {
  SeededCryptoModuleWithHelpers,
} from "@dicekeys/seeded-crypto-js";
import {
  diceKeyIdToNicknameMap
} from "./dicekey-nicknames"
import {
  PublicKeySet,
  PopulatePublicKeyCacheFn, populatePublicKeyCacheFnFactory
} from "./public-key-set";

const rewriteFieldName = (keyId: string) => (fieldName: string) => `DiceKeyState:${keyId}:${fieldName}`;

export class DiceKeyStateStore extends AppStateStore {
  public readonly populatePublicKeyCache: PopulatePublicKeyCacheFn;

  constructor(
    protected readonly seededCryptoModule: SeededCryptoModuleWithHelpers,
    protected readonly keyId: string
  ) {
    super(rewriteFieldName(keyId));
    this.populatePublicKeyCache = populatePublicKeyCacheFnFactory(this.seededCryptoModule,  this);
  }


  public readonly nicknameField = this.addStringField("nickname");
  public get nickname() { return this.nicknameField.value }
  public set nickname(newNickname: string | undefined) {
    this.nicknameField.set(newNickname);
    const newMap = diceKeyIdToNicknameMap.value ?? {};
    if (newNickname != null) {
      newMap[this.keyId] = newNickname
    } else {
      delete newMap[this.keyId];
    }
    diceKeyIdToNicknameMap.set(newMap);
  }
  public readonly publicKeySetField = this.addField<PublicKeySet>("publicKeySet");
  public get publicKeySet() { return this.publicKeySetField?.value }
  public set publicKeySet(value: PublicKeySet | undefined) { this.publicKeySetField?.set(value) }
  public readonly hasBeenReadWithoutError = this.addField<boolean>(`hasBeenReadWithoutError`);
  public readonly hasBeenBackedUpToWords = this.addField<boolean>(`hasBeenReadWithoutError`);
  public readonly hasBeenBackedUpToReplica = this.addField<boolean>(`hasBeenReadWithoutError`);
  
  public get hasSealingKey() { return (this.publicKeySet?.sealingKeys.length ?? 0) > 0 }
  public get hasSignatureVerificationKey() { return (this.publicKeySet?.signatureVerificationKeys.length ?? 0) > 0 }

  private static instances = new Map<string, DiceKeyStateStore>();
  public static instanceFor = (
    seededCryptoModule: SeededCryptoModuleWithHelpers,
    keyId: string
  ) => {
    if (!DiceKeyStateStore.instances.has(keyId)) {
      DiceKeyStateStore.instances.set(keyId, new DiceKeyStateStore(seededCryptoModule, keyId))
    }
    return DiceKeyStateStore.instances.get(keyId)!;
  }
}