import {
  ApiCalls,
  Recipe
} from "@dicekeys/dicekeys-api-js";
import {
  QueuedApiRequest
} from "../api-handler/handle-api-request"
import {
  throwIfHostNotPermitted
} from "../api-handler/handle-post-message-api-request";

const commandsRequiringMay = [
  ApiCalls.Command.getSymmetricKey,
  ApiCalls.Command.getUnsealingKey,
  ApiCalls.Command.getSigningKey
] as const

describe ("API Permission Checks", () => {
    for (const command of commandsRequiringMay) {
      test (`Cannot ${command} unless clientMayRetrieveKey recipe field set to true`, () => {
        expect( () => QueuedApiRequest.throwIfClientMayNotRetrieveKey({
          command,
          recipe: JSON.stringify(Recipe({
          }))
        } as ApiCalls.RequestMessage )).toThrow();
      })
    }

    for (const command of commandsRequiringMay) {
      test (`Can ${command} if clientMayRetrieveKey recipe field set to true`, () => {
        QueuedApiRequest.throwIfClientMayNotRetrieveKey({
          command,
          recipe: JSON.stringify(Recipe({
            clientMayRetrieveKey: true
          }))
        } as ApiCalls.RequestMessage);
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