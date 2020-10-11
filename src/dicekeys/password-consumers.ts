import {
  derivationOptionsJsonForAllowedDomains
} from "./derivation-options-json-for-allowed-domains";

export type SingletonOrArrayOf<T> = T | T[];

export const asArray = <T>(x: SingletonOrArrayOf<T> | undefined): T[] =>
  Array.isArray(x) ? [...x] :
  typeof x !== "undefined" ? [x] :
  [];

export interface PasswordConsumerContentInjectionParameters {
  masterPasswordFieldSelector?: SingletonOrArrayOf<string>;
  masterPasswordConfirmationFieldSelector?: SingletonOrArrayOf<string>;
  elementToAugmentSelector?: string,
  hintFieldSelector?: SingletonOrArrayOf<string>;
}

export interface PasswordConsumerSecurityParameters {
  derivationOptionsJson: string,
//  domains: AllowableDomain[];
  masterPasswordRuleCompliancePrefix?: string;
}

export enum PasswordConsumerType {
  PasswordManager = "PasswordManager",
  IdentityProvider = "IdentityProvider",
  AuthenticatorApp = "AuthenticatorApp",
  UserEntered = "UserEntered"
}

export interface PasswordConsumer extends
  PasswordConsumerSecurityParameters,
  PasswordConsumerContentInjectionParameters
{
  name: string;
  type: PasswordConsumerType
}

export const passwordDerivationOptionsJson = (hostOrHosts: SingletonOrArrayOf<string>) => 
  derivationOptionsJsonForAllowedDomains(asArray(hostOrHosts));

export const passwordDerivationOptionsJsonObj = (domains: SingletonOrArrayOf<string>) => ({
  derivationOptionsJson: passwordDerivationOptionsJson(domains)
});

const defaultPasswordManagerSecurityParameters = (
  ...domains: string[]
): PasswordConsumerSecurityParameters => ({
  ...passwordDerivationOptionsJsonObj(domains),
});


const defaultPasswordConsumerList: PasswordConsumer[] = [
  {
    name: "1Password",
    type: PasswordConsumerType.PasswordManager,

    ...defaultPasswordManagerSecurityParameters("1password.com"),

    masterPasswordFieldSelector: "#master-password, #custom-master-password",
    masterPasswordConfirmationFieldSelector: "confirm-master-password",
    hintFieldSelector: undefined,
  },
  {
    name: "Apple",
    type: PasswordConsumerType.IdentityProvider,
    ...defaultPasswordManagerSecurityParameters("apple.com"),
  },
  {
    name: "Authy",
    type: PasswordConsumerType.AuthenticatorApp,

    ...defaultPasswordManagerSecurityParameters("authy.com"),
  },
  {
    name: "Bitwarden",
    type: PasswordConsumerType.PasswordManager,

    ...defaultPasswordManagerSecurityParameters("bitwarden.com"),

    masterPasswordFieldSelector: "#masterPassword",
    masterPasswordConfirmationFieldSelector: "#masterPasswordRetype",
    hintFieldSelector: "#hint",
  },
  {
    name: "Facebook",
    type: PasswordConsumerType.IdentityProvider,

    ...defaultPasswordManagerSecurityParameters("facebook.com"),
  },
  {
    name: "Google",
    type: PasswordConsumerType.IdentityProvider,

    ...defaultPasswordManagerSecurityParameters("google.com"),
  },
  {
    name: "Keeper",
    type: PasswordConsumerType.PasswordManager,

    ...defaultPasswordManagerSecurityParameters("keepersecurity.com", "keepersecurity.eu"),
    masterPasswordRuleCompliancePrefix: "A1! ",

    elementToAugmentSelector: `.password > label`,
    masterPasswordFieldSelector: `input[type='password'][name='pass'], input[type='text'][name='pass'], textarea[name='master_pass']`,
    // masterPasswordConfirmationFieldSelector: undefined, // no confirmation field in this UX
    // hintFieldSelector: undefined, // no hint interface in this UX
  },
  {
    name: "LastPass",
    type: PasswordConsumerType.PasswordManager,

    ...defaultPasswordManagerSecurityParameters("lastpass.com"),
    masterPasswordRuleCompliancePrefix: "A1! ",

    elementToAugmentSelector: `input[name='password'] + label`,
    masterPasswordFieldSelector: "#masterpassword, input:not(.VK_no_animate)[name='password']",
    masterPasswordConfirmationFieldSelector: "#confirmmpw",
    hintFieldSelector: "#passwordreminder",
  },
  {
    name: "Microsoft",
    type: PasswordConsumerType.IdentityProvider,

    ...defaultPasswordManagerSecurityParameters("microsoft.com","live.com"),
  }
]


const passwordConsumersStorageKey = "dicekeys:password-consumers.ts:PasswordConsumers"
const getStoredPasswordConsumers = (): PasswordConsumer[] => {
  const passwordConsumerArray = JSON.parse(
    localStorage.getItem(passwordConsumersStorageKey) ?? "[]"
  ) as PasswordConsumer[];
  if (!Array.isArray(passwordConsumerArray)) {
    return []
  }
  return passwordConsumerArray.filter( consumer =>
    typeof consumer.derivationOptionsJson === "string" &&
    typeof consumer.name === "string"
  )
}
export const removeStoredPasswordConsumer = (nameOfPasswordConsumerToRemove: string): void => {
  const updatedPasswordConsumers = getStoredPasswordConsumers()
    .filter( consumer => consumer.name != nameOfPasswordConsumerToRemove );
  localStorage.setItem(passwordConsumersStorageKey, JSON.stringify(updatedPasswordConsumers));
}

export const addStoredPasswordConsumer = (newPasswordConsumer: PasswordConsumer): void=> {
  const updatedPasswordConsumers = getStoredPasswordConsumers()
      .filter( consumer => consumer.name != newPasswordConsumer.name )
      .concat(newPasswordConsumer)
  localStorage.setItem(passwordConsumersStorageKey, JSON.stringify(updatedPasswordConsumers));
}

export const getPasswordConsumers = (): PasswordConsumer[] => [
  ...defaultPasswordConsumerList,
  ...getStoredPasswordConsumers(),
].sort( (a, b) =>
  // First sort by type
  a.type.localeCompare(b.type) ||
  // the by name
  a.name.localeCompare(b.name)
)


export const getPasswordConsumersGroupedByType = (): [PasswordConsumerType, PasswordConsumer[]][] =>
getPasswordConsumers().reduce( (result, passwordConsumer) => {
    if (result.length > 0 && result[0][0] === passwordConsumer.type) {
      // The password consumer is of the same type as the list
      // we are currently appending to
      result[0][1].push(passwordConsumer)
    } else {
      // This is a new password consumer type, so start a new list.
      result.unshift([passwordConsumer.type, [passwordConsumer]]);
    }
    return result;
  }, [[PasswordConsumerType.UserEntered,[]]] as [PasswordConsumerType, PasswordConsumer[]][]).reverse();

// export const getPasswordManagerFoHostName = (hostName: string): PasswordConsumer | undefined => {
//   const lowercaseHostName = hostName.toLocaleLowerCase();
//   return passwordConsumers.find( ({domains}) =>
//     !!domains.find( ({domain, scope}) =>
//       (scope !== SubdomainRule.onlyAllowSubdomains && lowercaseHostName === domain) ||
//       (scope !== SubdomainRule.forbidSubdomains && lowercaseHostName.endsWith(`.${domain}`))
//     )
//   )
// }

// const getPasswordManagerForUrlObject = (url: URL | Location) =>
//   (url.origin.startsWith("https://") || undefined) &&
//   getPasswordManagerFoHostName(url.hostname);

// /**
//  * Get the password manager record for the current URL, or return
//  * undefined if the current URL does not belong to a password manager.
//  * 
//  * @param url A URL in the form of a string or URL object.
//  */
// export const getPasswordManagerForUrl = (url: string | URL | Location) =>
//   getPasswordManagerForUrlObject( typeof url === "string" ? new URL(url) : url);

