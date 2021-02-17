import {
  ApiCalls,
  Recipe
} from "@dicekeys/dicekeys-api-js";
import {
  throwIfClientMayNotRetrieveKey,
} from "../api-handler/permission-checks"
import {
  throwIfHostNotPermitted
} from "../api-handler/post-message-permission-checks";

const commandsRequiringMay = [
  ApiCalls.Command.getSymmetricKey,
  ApiCalls.Command.getUnsealingKey,
  ApiCalls.Command.getSigningKey
] as const

describe ("API Permission Checks", () => {
    for (const command of commandsRequiringMay) {
      test (`Cannot ${command} unless clientMayRetrieveKey recipe field set to true`, () => {
        expect( () => throwIfClientMayNotRetrieveKey({
          command,
          recipe: JSON.stringify(Recipe({
          }))
        })).toThrow();
      })
    }

    for (const command of commandsRequiringMay) {
      test (`Can ${command} if clientMayRetrieveKey recipe field set to true`, () => {
        throwIfClientMayNotRetrieveKey({
          command,
          recipe: JSON.stringify(Recipe({
            clientMayRetrieveKey: true
          }))
        });
      })
    }
  
    });
  
  test ("Test throwIfHostNOtPermitted", () => {

    throwIfHostNotPermitted("example.com")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "example.com"}]
      }))
    })

    throwIfHostNotPermitted("example.com")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })

    throwIfHostNotPermitted("example.com")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "other.com"}, {host: "example.com"}]
      }))
    })

    expect( () => throwIfHostNotPermitted("example.comsuffixattack")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()

    expect( () => throwIfHostNotPermitted("example.com.suffixattack")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()
    
    expect( () => throwIfHostNotPermitted("examplesuffixattack.com")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()

    expect( () => throwIfHostNotPermitted("prefixattackexample.com.suffix")({
      command: ApiCalls.Command.getSecret,
      recipe: JSON.stringify(Recipe({
        allow: [{host: "example.com"}, {host: "other.com"}]
      }))
    })).toThrow()
  
});