import { action, makeAutoObservable } from "mobx";
import { DerivationRecipeType } from "../../dicekeys/StoredRecipe";
import { CachedApiCalls } from "../../api-handler/CachedApiCalls";
import { isValidJson } from "../../utilities/json";
import { SeededCryptoModulePromise } from "@dicekeys/seeded-crypto-js";
import { AsyncCalculation } from "../../utilities/AsyncCalculation";
import { DiceKey } from "../../dicekeys/DiceKey";
import { defaultOnException } from "../../utilities/default-on-exception";

const spaceJson = (spaces: number = 2) => (json: string | undefined): string | undefined => {
  return (json == null) ? json : JSON.stringify(JSON.parse(json), undefined, spaces);
}
const doubleSpaceJson = spaceJson(2);

const BIP39 = "BIP39" as const;
const OpenPGP_Private_Key = "OpenPGP Private Key" as const;
const OpenSSH_Private_Key = "OpenSSH Private Key" as const;
export const OutputFormats = {
  "Password": ["Password", "JSON"],
  "Secret": ["JSON", "Hex", BIP39],
  "SigningKey": [
    "JSON",
    OpenPGP_Private_Key,
    OpenSSH_Private_Key,
    "OpenSSH Public Key",
    "Hex (Signing Key)",
    /* "Hex (Signature-Verification Key)" */
  ],
  "SymmetricKey": ["JSON", "Hex"],
  "UnsealingKey": ["JSON", "Hex (Unsealing Key)", "Hex (Sealing Key)"],
} as const;
type OutputFormats = typeof OutputFormats;
export type OutputFormat<T extends DerivationRecipeType = DerivationRecipeType> = OutputFormats[T][number]
export type OutputFormatForType<T extends DerivationRecipeType = DerivationRecipeType> = {[type in DerivationRecipeType]?: OutputFormat<T>}
( () => {
  const TypeCheckOutputFormats: Record<DerivationRecipeType, readonly string[]> = OutputFormats;
  if (false) console.log(`${TypeCheckOutputFormats}`)
})
const DefaultOutputFormat =  {
  "Password": "Password",
  "Secret": "Hex",
  "SigningKey": "JSON",
  "SymmetricKey": "JSON",
  "UnsealingKey": "JSON",
} as const
export const outputFormats = <T extends DerivationRecipeType>(type: T): OutputFormats[T]  => OutputFormats[type];

export interface RecipeState {
  type?: DerivationRecipeType;
  recipeJson?: string;
  recipeIsValid: boolean;
}

interface SecretTypeAndOutputType<SECRET_TYPE extends DerivationRecipeType = DerivationRecipeType> {
  type: SECRET_TYPE;
  outputFormat: OutputFormat<SECRET_TYPE>
}

export class DerivedFromRecipeState {
  readonly recipeState: RecipeState;
  private readonly getDiceKey: () => DiceKey | undefined;
  get diceKey(): DiceKey | undefined {
    return this.getDiceKey(); 
  };
  SigningCalculations = new AsyncCalculation<string | undefined>();

  get api(): CachedApiCalls | undefined {
    const {diceKey} = this;
    if (diceKey == null) return;
    return CachedApiCalls.instanceFor(diceKey.toSeedString())
  }

  //////////////////////////////////////////
  // outputField to derive from recipe
  //////////////////////////////////////////  
  outputFieldForType: OutputFormatForType = {};
  outputFieldFor = <T extends DerivationRecipeType>(t: T): OutputFormat<T> => {
    const outputFormatChosenByUser = this.outputFieldForType[t] as OutputFormat<T>;
    if (outputFormatChosenByUser != null) {
      return outputFormatChosenByUser;
    }
    const purposeLowerCase = defaultOnException(() =>
      (JSON.parse(this.recipeState.recipeJson ?? "{}") as {purpose?: string})?.purpose?.toLocaleLowerCase()
    );
    // If this is a signing key and the name includes "pgp", default the output format to PGP private key
    if (t === "SigningKey" && purposeLowerCase?.includes("pgp")) {
      return OpenPGP_Private_Key;
    }
    // If this is a signing key and the name includes "ssh", default the output format to an SSH private key
    if (t === "SigningKey" && purposeLowerCase?.includes("ssh")) {
      return OpenSSH_Private_Key;
    }

    // If this is a crypto wallet secret, default to BIP39 format
    if (t === "Secret" && purposeLowerCase === "wallet") {
      return BIP39;
    }
    // Otherwise, use the default from the table
    return DefaultOutputFormat[t];
  };
  setOutputField = action ( (value: OutputFormat<DerivationRecipeType>) => {
    const recipeType = this.recipeState.type;
    if (recipeType != null && (OutputFormats[recipeType] as readonly string[]).indexOf(value) != -1) {
      this.outputFieldForType[recipeType] = value;
    }
  });
  setOutputFieldTo = (value: OutputFormat<DerivationRecipeType>) => () => this.setOutputField(value);

  showQrCode: boolean = false;
  setShowQrCode = action( (showQrCode: boolean) => this.showQrCode = showQrCode);
  setShowQrCodeOn = () => this.setShowQrCode(true);
  setShowQrCodeOff = () => this.setShowQrCode(false);

  get secretTypeAndOutputType(): SecretTypeAndOutputType | undefined {
    const {type} = this.recipeState;
    if (type == null) return;
    const outputFormat = this.outputFieldFor(type);
    return {type, outputFormat};
  }

  constructor({recipeState, getDiceKey}: {recipeState: RecipeState, getDiceKey: () => DiceKey | undefined} ) {
    this.recipeState = recipeState;
    this.getDiceKey = getDiceKey;
//    this.api = new CachedApiCalls(seedString);

    makeAutoObservable(this);
  }

  get derivedSeedBytesHex(): string | undefined {
    const {recipeState, api} = this;
    const {type, recipeJson, recipeIsValid} = recipeState;
    if (type !== "Secret" || recipeIsValid !== true || recipeJson == null) return;
    return api?.getSecretHexForRecipe(recipeJson);
  }

  get derivedValue(): string | undefined {
    const {recipeState, api} = this;
    const {recipeJson, recipeIsValid} = recipeState;
    const secretTypeAndOutputType = this.secretTypeAndOutputType;
    if (secretTypeAndOutputType == null || !isValidJson(recipeJson) || !recipeIsValid) return;
    const {type, outputFormat} = secretTypeAndOutputType;

    switch (type) {
        case "Password":
          // Someday, maybe typescript will correctly manage this output format!
          switch (outputFormat as OutputFormat<"Password">) {
          // switch (this.outputFieldFor("Password")) {
            case "Password":
              return api?.getPasswordForRecipe(recipeJson);
            case "JSON":
              return doubleSpaceJson(api?.getPasswordJsonForRecipe(recipeJson))
          }
        case "Secret":
          switch (this.outputFieldFor("Secret")) {
            case BIP39:
              return api?.getSecretBip39ForRecipe(recipeJson);
            case "Hex":
              return api?.getSecretHexForRecipe(recipeJson);
            case "JSON":
              return doubleSpaceJson(api?.getSecretJsonForRecipe(recipeJson));
          }
        case "SymmetricKey":
          switch (this.outputFieldFor("SymmetricKey")) {
            case "Hex":
              return api?.getSymmetricKeyHexForRecipe(recipeJson);
            case "JSON":
              return doubleSpaceJson(api?.getSymmetricKeyJsonForRecipe(recipeJson));
          }
        case "UnsealingKey":
          switch (this.outputFieldFor("UnsealingKey")) {
            case "Hex (Unsealing Key)":
              return api?.getUnsealingKeyHexForRecipe(recipeJson);
            case "Hex (Sealing Key)":
              return api?.getSealingKeyHexForRecipe(recipeJson);
            case "JSON":
              return doubleSpaceJson(api?.getUnsealingKeyJsonForRecipe(recipeJson));
          }
        case "SigningKey":
          switch (this.outputFieldFor("SigningKey")) {
            case "Hex (Signing Key)":
              return api?.getSigningKeyHexForRecipe(recipeJson);
            case "OpenPGP Private Key": {
              const signingKeyJson = api?.getSigningKeyJsonForRecipe(recipeJson);
              if (signingKeyJson == null) return undefined;
              return this.SigningCalculations.get(`${this.outputFieldFor("SigningKey")}:${recipeJson}}`, async () => {
                const signingKey = (await SeededCryptoModulePromise)?.SigningKey.fromJson(signingKeyJson);
                try {
                  return signingKey.toOpenPgpPemFormatSecretKey("" /*user id*/, Math.floor(Date.now() / 1000));
                } finally {
                  signingKey.delete();
                }                
              })
            }
            case "OpenSSH Private Key": {
              const signingKeyJson = api?.getSigningKeyJsonForRecipe(recipeJson);
              if (signingKeyJson == null) return undefined;
              return this.SigningCalculations.get(`${this.outputFieldFor("SigningKey")}:${recipeJson}}`, async () => {
                const signingKey = (await SeededCryptoModulePromise)?.SigningKey.fromJson(signingKeyJson);
                try {
                  return signingKey.toOpenSshPemPrivateKey("" /* comment */);
                } finally {
                  signingKey.delete();
                }                
              })
            }
            case "OpenSSH Public Key": {
              const signingKeyJson = api?.getSigningKeyJsonForRecipe(recipeJson);
              if (signingKeyJson == null) return undefined;
              return this.SigningCalculations.get(`${this.outputFieldFor("SigningKey")}:${recipeJson}}`, async () => {
                const signingKey = (await SeededCryptoModulePromise)?.SigningKey.fromJson(signingKeyJson);
                try {
                  return signingKey.toOpenSshPublicKey();
                } finally {
                  signingKey.delete();
                }                
              })
            }
            case "JSON":
              return doubleSpaceJson(api?.getSigningKeyJsonForRecipe(recipeJson));
          }
      }
  }
}