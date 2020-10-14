import styles from "./demo.module.css";
import {
  UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Div, Observable
} from "../../web-component-framework";
import {
  ApiRequestWithSeedParameterNames,
} from "../../workers/call-api-command-worker";
import {
  DefaultPermittedPathPrefix
} from "../../api-handler/url-permission-checks";
import {
  PrescribedTextFieldSpecification,
  PrescribedTextFieldObservables,
  PrescribedTextInput
} from "../basic-building-blocks"
import {
  Formula,
  FormulaInputVariable,
  ParameterCard
} from "./basic-api-demo-components"
import { SealAndUnseal, SymmetricKeySealAndUnseal } from "./multi-command-simulator";

interface ApiDemoOptions extends Attributes {
  seedString?: PrescribedTextFieldSpecification<string>;
}

export class ApiDemo extends Component<ApiDemoOptions> {
  
  commaSeparatedAuthorizedDomains = new PrescribedTextFieldObservables<string, "domains">("domains", {
    formula: Formula("authorizedDomains[]", "string[]", [FormulaInputVariable({}, "authorizedDomain1"), ", ... , ", FormulaInputVariable({}, "authorizedDomainN")]),
    actual: 'example.pwmgr.app, example.com',
    usePrescribed: false
  });

  authorizedDomains: Observable<string[]>;

  // derivationOptionsJson = new PrescribedTextFieldObservables<string, "domains">("domains", {
  //   formula: Formula("derivationOptionsJson", `'{"allow":[{"host":"*.`, FormulaInputVariable({}, "authorizedDomains[i]"), `"}]}'`)
  // });

  seedString: PrescribedTextFieldObservables<string, typeof ApiRequestWithSeedParameterNames.seedString>;

  respondTo = new PrescribedTextFieldObservables<string, typeof UrlRequestMetadataParameterNames.respondTo>(
    UrlRequestMetadataParameterNames.respondTo, {
      formula: Formula("respondTo", "string", "'", "https://", FormulaInputVariable({}, "authorizedDomains[i]"), DefaultPermittedPathPrefix, "'")
    }
  )

  constructor(options: ApiDemoOptions) {
    super(options);
    this.seedString = new PrescribedTextFieldObservables(ApiRequestWithSeedParameterNames.seedString,
        {
          formula: Formula("seed", "string | byte[]", 'DiceKeys.toSeed(', FormulaInputVariable({}, "diceKey"),  ')'),
          // prescribed: new URL(window.location.href).searchParams.get(ApiRequestWithSeedParameterNames.seedString) ?? 
          //   "A1tB2rC3bD4lE5tF6rG1bH2lI3tJ4rK5bL6lM1tN2rO3bP4lR5tS6rT1bU2lV3tW4rX5bY6lZ1t",
          prescribed: new URL(window.location.href).searchParams.get(ApiRequestWithSeedParameterNames.seedString) ?? 
            "A1tB2rC3bD4lE5tF6rG1bH2lI3tJ4rK5bL6lM1tN2rO3bP4lR5tS6rT1bU2lV3tW4rX5bY6lZ1t",
          ...options.seedString
        }
      );
    this.authorizedDomains = new Observable<string[]>([]);
    this.commaSeparatedAuthorizedDomains.actual.observe( (commaSeparatedAuthorizedDomains) =>
        this.authorizedDomains.set(
          (commaSeparatedAuthorizedDomains || "").split(",")
            .map( domain => domain.trim() )
        )
      );
    this.authorizedDomains.observe( authorizedDomains =>
//      this.derivationOptionsJson.prescribed.set(derivationOptionsJsonForAllowedDomains(this.domains));
      this.respondTo.prescribed.set(`${window.location.protocol}//${
          (authorizedDomains && authorizedDomains.length > 0) ? authorizedDomains[0] : window.location.host
        }${DefaultPermittedPathPrefix}`)
    );
  }


  get domains(): string[] {
    return this.commaSeparatedAuthorizedDomains.value
      .split(",")
      .map( domain => domain.trim() );
  }

  render() {
    super.render(
      ParameterCard({},
          Div({class: styles.instructions}, 
            `When you make an API call to the DiceKeys app, the app will derive secrets from a a seed
            <a href="https://dicekeys.github.io/seeded-crypto/introduction.html" target="new">generated from the user's DiceKey</a>.
            The seed you enter will be used to simulate API calls below.
          `),
          new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.seedString}),
      ),
      ParameterCard({},
        Div({class: styles.instructions}, 
          `Whether on the web, iOS, or Android, your applications and services will be authenticated by their domain name(s).
          Enter the domain names that should be allowed to perform cryptographic operations on your keys.
        `),
        new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.commaSeparatedAuthorizedDomains}),
      ),
      ParameterCard({},
        Div({class: styles.instructions}, 
          `When making your API call via the URL-based API, you'll need to provide the URL to which the DiceKeys app should post the response.
          (The request will be denied if the URL receiving the response isn't authorized to use the derived keys.)
        `),
        new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.respondTo}),
      ),
      new SealAndUnseal({
        onExceptionEvent: this.options.onExceptionEvent,
        authorizedDomains: this.authorizedDomains,
        seedString: {prescribed: this.seedString.actual},
        respondTo: {prescribed: this.respondTo.actual},
      }),
      new SymmetricKeySealAndUnseal({
        onExceptionEvent: this.options.onExceptionEvent,
        authorizedDomains: this.authorizedDomains,
        seedString: {prescribed: this.seedString.actual},
        respondTo: {prescribed: this.respondTo.actual},
      })
    );
  }

}