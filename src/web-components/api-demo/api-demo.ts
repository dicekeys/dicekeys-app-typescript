//  import styles from "./demo.module.css";
import {
  UrlRequestMetadataParameterNames
} from "@dicekeys/dicekeys-api-js";
import {
  Component, Attributes, Observable, H1, H2, H3
} from "../../web-component-framework";
import {
  ApiRequestWithSeedParameterNames,
} from "../../workers/call-api-command-worker";
import {
  DefaultPermittedPathPrefix
} from "../../api-handler/url-permission-checks";
import {
  ExpandableComponent,
  PrescribedTextFieldSpecification,
  PrescribedTextFieldObservables,
  PrescribedTextInput,
} from "../basic-building-blocks"
import {
  FnCallName,
  Formula,
  InputVar,
  Instructions,
  ParameterCard,
  TemplateInputVar
} from "./basic-api-demo-components"
import { SealAndUnseal, SymmetricKeySealAndUnseal } from "./demos";
import { DICEKEY, DICEKEYS } from "~web-components/dicekey-styled";
import { CommandSimulator } from "./command-simulator";

interface ApiDemoOptions extends Attributes {
  seedString?: PrescribedTextFieldSpecification<string>;
}

export class ApiDemo extends Component<ApiDemoOptions> {
  
  commaSeparatedAuthorizedDomains = new PrescribedTextFieldObservables<string, "domains">("domains", {
    formula: Formula("authorizedDomains[]", "string[]", [InputVar("authorizedDomain1"), ", ... , ", InputVar("authorizedDomainN")]),
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
      formula: Formula("respondTo", "string", "`", "https://", TemplateInputVar("authorizedDomains[i]"), DefaultPermittedPathPrefix, "`")
    }
  )

  constructor(options: ApiDemoOptions) {
    super(options);
    this.seedString = new PrescribedTextFieldObservables(ApiRequestWithSeedParameterNames.seedString,
        {
          formula: Formula("seed", "string | byte[]", 'DiceKeys.', "toSeed", "(", InputVar("diceKey"),  ')'),
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
    const baseParams = {
      onExceptionEvent: this.options.onExceptionEvent,
      authorizedDomains: this.authorizedDomains,
      seedString: {prescribed: this.seedString.actual},
      respondTo: {prescribed: this.respondTo.actual},
    } as const;

    super.render(
      H1({},
        DICEKEYS(), ` URL-based API Tutorial and Playground`
      ),
      Instructions(`
        Your application can use this API to ask the `, DICEKEYS(),` App to derive secrets from the user's `, DICEKEY(), `
        and perform cryptographic operations using those secrets.
      `),
      Instructions(`
        In the examples below,
        <span style="color: #000040; background-color: #ffffe0;">input fields with black text on yellow backgrounds</span>
        are those you are encouraged to edit.
        <span style="color: #008000; background-color: #fefefe;">Fields with green text</span> are also editable,
        but have been pre-populated with recommended values for the worked examples.
      `),
      H2({}, `API Setup`),
      Instructions(`
        Your application will transmit requests via URLs, which are supported
        for inter-application communication by both
        <a  target="new" href="https://developer.android.com/training/app-links/deep-linking">Android</a> and 
        <a target="new"  href="https://developer.apple.com/documentation/uikit/uiapplication/1648685-open">iOS</a>.
        Since the `, DICEKEYS(),` App  responds by transmitting a URL back to your application or service,
        you will need to select which domain names your application will use in those URLS 
        (domain names that you own that you can use to identify your application or service.)
      `),
      ParameterCard(
        Instructions(` 
          Enter the domain names permitted to receive the results of your API requests.
        `),
        new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.commaSeparatedAuthorizedDomains}),
      ),
      ParameterCard(
        Instructions(` 
          Enter the URL to which the DiceKeys app should post the response to this request.
        `), 
        // (The request will be denied if the URL receiving the response isn't authorized to use the derived keys.)
        new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.respondTo}),
      ),
      Instructions(`
        When you call the `, DICEKEYS(),` App, it converts the user's DiceKey into a seed in
        <a href="https://dicekeys.github.io/seeded-crypto/introduction.html" target="new">this format</a>.
        You can edit it if you like.
      `),
      ParameterCard(
        new PrescribedTextInput({style: `width: 37.5rem;`, observables: this.seedString}),
    ),
    H2({}, `Use Cases`),
      Instructions(`
        We use the term seal and unseal in place of encrypt and decrypt since our primitives include message authentication.
      `),

      //
      new ExpandableComponent({}, () =>
        new SealAndUnseal({
          onExceptionEvent: this.options.onExceptionEvent,
          ...baseParams,
          useGlobalKey: true,
        }),
        H3({}, `Seal and Unseal Data with Public Key Pair`),
        Instructions(`
          Use the API's `, FnCallName("getSealingKey"), ` command to get a public-key derived from the user's `, DICEKEY() ,`,
          seal data locally using that sealing key, adding unsealingInstructions to ensure only your application/service can unseal it,
          and then unseal the data by calling the API's `, FnCallName("unsealWithUnsealingKey"), ` command.
        `)
      ),

      //
      new ExpandableComponent({}, () =>
        new SealAndUnseal({
          ...baseParams,
          useGlobalKey: false,
        }),
        H3({}, `Seal and Unseal Data with an <i>Application-Exclusive</i> Public Key Pair`),
        Instructions(`
          Use the API's `, FnCallName("getSealingKey"), ` command to get a public-key derived exclusively for your service/application
          from the user's `, DICEKEY() ,`,
          seal data locally using that sealing key,
          and then unseal the data by calling the API's `, FnCallName("unsealWithUnsealingKey"), ` command.
        `)
      ),

      //
      new ExpandableComponent({}, () =>
        new SymmetricKeySealAndUnseal({
          ...baseParams
        }),
        H3({}, `Seal and Unseal Data with a Symmetric Key`),
        Instructions(`Seal and unseal messages using a symmetric key derived exclusively for your service/application
          from the user's `, DICEKEY() ,`.`)
      ),

      // GetPassword
      new ExpandableComponent({}, () =>
        new CommandSimulator({
          command: "getPassword",
          inputs: baseParams,
        }),
      H3({}, `Get a Password Derived from the User's `, DICEKEY()),
        Instructions(`Get a password derived from the user's `, DICEKEY(), `,
        which can be re-derived as needed in the future exclusively by your service/application.`)
      ),

      // GetPassword
      new ExpandableComponent({}, () =>
        new CommandSimulator({
          command: "getPassword",
          inputs: baseParams,
        }),
      H3({}, `Get a Secret Derived from the User's `, DICEKEY()),
        Instructions(`Get an array of secret bytes derived from the user's `, DICEKEY(), `,
        which can be re-derived as needed in the future exclusively by your service/application.
        For example, if you want to use a cryptographic algorithmic not supported by the APIs, you could
        derive a secret to use as a seed and use that seed to derive a cryptographic key.
        `)      ),
    );
  }

}