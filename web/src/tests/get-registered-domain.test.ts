import {
  getWildcardOfRegisteredDomainFromCandidateWebUrl,
} from "../utilities/domains"


describe("Get Registered Domain", () => {
  
  const testCases: [string /*input*/, string /*output*/][] = [

    ["https://account.google.com", "*.google.com"],
    ["https://google.com", "*.google.com"],
    ["https://dicekeys.app", "*.dicekeys.app"],
    ["https://api.dicekeys.com", "*.dicekeys.com"],
    ["https://vault.bitwarden.com", "*.bitwarden.com"],
    ["http://account.google.com", "*.google.com"],
    ["http://google.com", "*.google.com"],
    ["http://dicekeys.app", "*.dicekeys.app"],
    ["http://api.dicekeys.com", "*.dicekeys.com"],
    ["http://vault.bitwarden.com", "*.bitwarden.com"]
  ]

  for (const [testInput, expectedOutput] of testCases) {
    test(`${testInput} =?> ${expectedOutput}`, () => {
      const actualOutput = getWildcardOfRegisteredDomainFromCandidateWebUrl(testInput);
      expect(actualOutput).toStrictEqual(expectedOutput);
    });
  }

});