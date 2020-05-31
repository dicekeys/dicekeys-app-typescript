

class AuthenticationTokens {
  const mapOfAuthTokensToUrls = new Map<string, string>()

  add = (respondToUrl: string): void => {
      (Base64.encodeToString(SecureRandom().generateSeed(20), Base64.URL_SAFE)).also {
      mapOfAuthTokensToUrls[it] = respondToUrl
    }
  }

  getUrlForAuthToken = (
    authToken: string
  ) : string | undefined => this.mapOfAuthTokensToUrls.get(authToken)
}