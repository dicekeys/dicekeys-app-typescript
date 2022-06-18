import {
  isUrlOnAllowList,
} from "../api-handler/url-permission-checks"

const defaultHost = "example.com";

describe ("URL API Permissions", () => {

  const casesFromDocumentation: [ string, [ boolean, string[] ][] ][] =
  (
    [
      [
        "/here/*",
        [
          [true, ["/here/and/there", "/here/", "/here"]],
          [false, ["/hereandthere/", "/her", "/her/", "/thereandhere", "/thereandhere/"]]
        ]
      ],
      [
        "/here*",
        [
          [true, ["/here/and/there", "/here/", "/here", "/hereandthere/"]],
          [false, ["/her", "/her/", "/thereandhere", "/thereandhere/"]]
        ]
      ]
    ]
  );
  casesFromDocumentation.forEach(
    ([pathRequired, casesForPathRequired]) =>
      casesForPathRequired.forEach( ([expectedResult, testPathList]) => {
        testPathList.forEach( (testPath) => {
          test (`examples from documentation: required: "${pathRequired}", observed: "${testPath}" expecting ${expectedResult}"`, () => {
      
            expect(isUrlOnAllowList({
              protocol: "https:",
              host: defaultHost,
              pathname: testPath,
              webBasedApplicationIdentities: [ {host: defaultHost, paths: [pathRequired] } ]
            }))
            .toBe(expectedResult);
          });
  })}));

  test ("Path prefix match", () => {

    expect(isUrlOnAllowList({
      protocol: "https:",
      host: defaultHost,
      pathname: "/ourPathInTheMiddleOfOurStreet",
      webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: defaultHost, paths: ["bogusPath", "ourPath*"]}
        ]
    })).toBe(true);
  });

  test ("Path exact match", () => {
    expect(
      isUrlOnAllowList({
        protocol: "https:",
        host: defaultHost,
        pathname: "/ourPathInTheMiddleOfOurStreet",
        webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: defaultHost, paths: ["/bogusPath", "/ourPathInTheMiddleOfOurStreet"]}
        ]
    })
    ).toBe(true);
  });
    
  test("Path mismatch detected", () => {
    expect(
      isUrlOnAllowList({
        protocol: "https:",
        host: defaultHost,
        pathname: "/someoneElsesPathInTheMiddleOfTheirStreet",
        webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: defaultHost, paths: ["bogusPath", "ourPathourPathInTheMiddleOfOurStreet"]}
        ]
      })
    ).toBe(false)
  });

  test("Host suffix test", () => {
    expect(
      isUrlOnAllowList({
        protocol: "https:",
        host: defaultHost,
        pathname: "/inTheMiddleofOurStreet",
        webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: "*.example.com", paths: ["bogusPath", "inTheMiddleofOurStreet"]}
        ]
      })
    ).toBe(true);
  });

  test("Host suffix test should work if no subdomain", () => {
    expect(
      isUrlOnAllowList({
        protocol: "https:",
        host: defaultHost,
        pathname: "/inTheMiddleofOurStreet",
        webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: "*.example.com", paths: ["bogusPath", "inTheMiddleofOurStreet"]}
        ]
      })
    ).toBe(true);
  });


  test("Host suffix test bad domain should fail", () => {
    expect(
      isUrlOnAllowList({
        protocol: "https:",
        host: "ex.sample.com",
        pathname: "/inTheMiddleofOurStreet",
        webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: "*.example.com", paths: ["bogusPath", "/inTheMiddleofOurStreet"]}
        ]
      })
    ).toBe(false);
  });

  test("Host suffix test should work if no subdomain", () => {
    expect(
      isUrlOnAllowList({
        protocol: "https:",
        host: "ex-sample.com",
        pathname: "/inTheMiddleofOurStreet",
        webBasedApplicationIdentities: [
          {host: "bogus eentry to make sure we look beyond first entry"},
          {host: "*.example.com", paths: ["bogusPath", "/inTheMiddleofOurStreet"]}
        ]
      })
    ).toBe(false);
  });

  
});