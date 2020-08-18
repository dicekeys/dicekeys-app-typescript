export enum SubdomainRule {
  onlyAllowSubdomains = "onlyAllowSubdomains",
  forbidSubdomains = "forbidSubdomains",
  allowDomainAndItsSubdomains = "allowDomainAndItsSubdomains"
};

export interface AllowableDomain {
  domain: string;
  scope?: SubdomainRule;
}

export type SingletonOrArrayOf<T> = T | T[];

export const asArray = <T>(x: SingletonOrArrayOf<T> | undefined): T[] =>
  Array.isArray(x) ? [...x] :
  typeof x !== "undefined" ? [x] :
  [];

export interface PasswordManagerContentInjectionParameters {
  masterPasswordFieldSelector?: SingletonOrArrayOf<string>;
  masterPasswordConfirmationFieldSelector?: SingletonOrArrayOf<string>;
  elementToAugmentSelector?: string,
  hintFieldSelector?: SingletonOrArrayOf<string>;
}

export interface PasswordManagerSecurityParameters {
  derivationOptionsJson: string,
  domains: AllowableDomain[];
  masterPasswordRuleCompliancePrefix?: string;
}

export interface PasswordManager extends
  PasswordManagerSecurityParameters,
  PasswordManagerContentInjectionParameters
{
  name: string;
}

const defaultDomains = (hosts: SingletonOrArrayOf<string>) => ({
  domains: asArray(hosts).map( host => ({
    domain: host,
    scope: SubdomainRule.allowDomainAndItsSubdomains
  }) ),
});

const defaultDerivationOptionsJson = (hosts: SingletonOrArrayOf<string>) => ({
  derivationOptionsJson: `{"type": "Secret", "wordLimit": 13, "allow": [${
    asArray(hosts)
      .map( host => `{"host": "*.${host}"}`)
      .join(" ,")
  }]}`
});

const defaultPasswordManagerSecurityParameters = (
  hosts: SingletonOrArrayOf<string>
): PasswordManagerSecurityParameters => ({
  ...defaultDomains(hosts),
  ...defaultDerivationOptionsJson(hosts),
});

export const passwordManagers: PasswordManager[] = [
  {
    name: "1Password",

    ...defaultPasswordManagerSecurityParameters("1password.com"),

    masterPasswordFieldSelector: "#master-password, #custom-master-password",
    masterPasswordConfirmationFieldSelector: "confirm-master-password",
    hintFieldSelector: undefined,
  },
  {
    name: "Authy",

    ...defaultPasswordManagerSecurityParameters("authy.com"),
  },
  {
    name: "Bitwarden",

    ...defaultPasswordManagerSecurityParameters("bitwarden.com"),

    masterPasswordFieldSelector: "#masterPassword",
    masterPasswordConfirmationFieldSelector: "#masterPasswordRetype",
    hintFieldSelector: "#hint",
  },
  {
    name: "Keeper",

    ...defaultPasswordManagerSecurityParameters("keepersecurity.com"),
    masterPasswordRuleCompliancePrefix: "A1! ",

    elementToAugmentSelector: `.password > label`,
    masterPasswordFieldSelector: `input[type='password'][name='pass'], input[type='text'][name='pass'], textarea[name='master_pass']`,
    // masterPasswordConfirmationFieldSelector: undefined, // no confirmation field in this UX
    // hintFieldSelector: undefined, // no hint interface in this UX
  },
  {
    name: "LastPass",

    ...defaultPasswordManagerSecurityParameters("lastpass.com"),
    masterPasswordRuleCompliancePrefix: "A1! ",

    elementToAugmentSelector: `input[name='password'] + label`,
    masterPasswordFieldSelector: "#masterpassword, input:not(.VK_no_animate)[name='password']",
    masterPasswordConfirmationFieldSelector: "#confirmmpw",
    hintFieldSelector: "#passwordreminder",
  },
]

export const getPasswordManagerFoHostName = (hostName: string): PasswordManager | undefined => {
  const lowercaseHostName = hostName.toLocaleLowerCase();
  return passwordManagers.find( ({domains}) =>
    !!domains.find( ({domain, scope}) =>
      (scope !== SubdomainRule.onlyAllowSubdomains && lowercaseHostName === domain) ||
      (scope !== SubdomainRule.forbidSubdomains && lowercaseHostName.endsWith(`.${domain}`))
    )
  )
}

const getPasswordManagerForUrlObject = (url: URL | Location) =>
  (url.origin.startsWith("https://") || undefined) &&
  getPasswordManagerFoHostName(url.hostname);

/**
 * Get the password manager record for the current URL, or return
 * undefined if the current URL does not belong to a password manager.
 * 
 * @param url A URL in the form of a string or URL object.
 */
export const getPasswordManagerForUrl = (url: string | URL | Location) =>
  getPasswordManagerForUrlObject( typeof url === "string" ? new URL(url) : url);

