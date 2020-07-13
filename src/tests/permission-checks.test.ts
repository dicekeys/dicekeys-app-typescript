import {
  ApiStrings,
  DerivationOptions
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfClientMayNotRetrieveKey,
} from "../api-handler/permission-checks"
import {
  throwIfHostNotPermitted
} from "../api-handler/post-message-permission-checks";

const commandsRequiringMay = [
  ApiStrings.Commands.getSymmetricKey,
  ApiStrings.Commands.getUnsealingKey,
  ApiStrings.Commands.getSigningKey
] as const

describe ("API Permission Checks", () => {
    for (const command of commandsRequiringMay) {
      test (`Cannot ${command} unless clientMayRetrieveKey derivation option set`, () => {
        expect( () => throwIfClientMayNotRetrieveKey({
          command,
          derivationOptionsJson: JSON.stringify(DerivationOptions({
          }))
        })).toThrow();
      })
    }

    for (const command of commandsRequiringMay) {
      test (`Can ${command} if clientMayRetrieveKey derivation option set`, () => {
        throwIfClientMayNotRetrieveKey({
          command,
          derivationOptionsJson: JSON.stringify(DerivationOptions({
            clientMayRetrieveKey: true
          }))
        });
      })
    }
  
    });
  
  test ("Test throwIfHostNOtPermitted", () => {

    throwIfHostNotPermitted("example.com")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "example.com"}]
      }))
    })

    throwIfHostNotPermitted("example.com")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })

    throwIfHostNotPermitted("example.com")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "other.com"}, {host: "example.com"}]
      }))
    })

    expect( () => throwIfHostNotPermitted("example.comsuffixattack")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()

    expect( () => throwIfHostNotPermitted("example.com.suffixattack")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()
    
    expect( () => throwIfHostNotPermitted("examplesuffixattack.com")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()

    expect( () => throwIfHostNotPermitted("prefixattackexample.com.suffix")({
      command: ApiStrings.Commands.getSecret,
      derivationOptionsJson: JSON.stringify(DerivationOptions({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()
  
});