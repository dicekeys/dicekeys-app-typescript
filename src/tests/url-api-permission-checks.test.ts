// import {
//   UsersConsentResponse,
// } from "@dicekeys/dicekeys-api-js";
// import {
//   UrlApiPermissionChecks,
// } from "../api-handler/url-api-permission-checks"

// describe ("URL API Permissions", () => {
//   const requestUsersConsent = (response: UsersConsentResponse) => () =>
//     new Promise<UsersConsentResponse>( (respond) => respond(response) );

//   const casesFromDocumentation: [ string, [ boolean, string[] ][] ][] =
//   (
//     [
//       [
//         "/here/*",
//         [
//           [true, ["/here/and/there", "/here/", "/here"]],
//           [false, ["/hereandthere/", "/her", "/her/", "/thereandhere", "/thereandhere/"]]
//         ]
//       ],
//       [
//         "/here*",
//         [
//           [true, ["/here/and/there", "/here/", "/here", "/hereandthere/"]],
//           [false, ["/her", "/her/", "/thereandhere", "/thereandhere/"]]
//         ]
//       ]
//     ]
//   );
//   casesFromDocumentation.forEach(
//     ([pathRequired, casesForPathRequired]) =>
//       casesForPathRequired.forEach( ([expectedResult, testPathList]) => {
//         testPathList.forEach( (testPath) => {
//           test (`examples from documentation: required: "${pathRequired}", observed: "${testPath}" expecting ${expectedResult}"`, () => {
      
//             expect(new UrlApiPermissionChecks(`https://example.com${testPath}`, requestUsersConsent(UsersConsentResponse.Allow))
//               .doesClientMeetAuthenticationRequirements({
//                 allow: [ {host: "example.com", paths: [pathRequired] } ]
//             })).toBe(expectedResult);
//           });
//   })}));

//   test ("Path prefix match", () => {

//     expect(new UrlApiPermissionChecks("https://example.com/ourPathInTheMiddleOfOurStreet", requestUsersConsent(UsersConsentResponse.Allow))
//       .doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "example.com", paths: ["bogusPath", "ourPath*"]}
//         ]
//     })).toBe(true);
//   });

//   test ("Path exact match", () => {
//     expect(
//       new UrlApiPermissionChecks("https://example.com/ourPathInTheMiddleOfOurStreet",
//         requestUsersConsent(UsersConsentResponse.Allow)
//       ).doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "example.com", paths: ["/bogusPath", "/ourPathInTheMiddleOfOurStreet"]}
//         ]
//       })
//     ).toBe(true);
//   });
    
//   test("Path mismatch detected", () => {
//     expect(
//       new UrlApiPermissionChecks(
//         "https://example.com/someoneElsesPathInTheMiddleOfTheirStreet",
//         requestUsersConsent(UsersConsentResponse.Allow)
//       ).doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "example.com", paths: ["bogusPath", "ourPathourPathInTheMiddleOfOurStreet"]}
//         ]
//       })
//     ).toBe(false)
//   });

//   test("Host suffix test", () => {
//     expect(
//       new UrlApiPermissionChecks(
//         "https://ourhouse.example.com/inTheMiddleofOurStreet",
//         requestUsersConsent(UsersConsentResponse.Allow)
//       ).doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "*.example.com", paths: ["bogusPath", "inTheMiddleofOurStreet"]}
//         ]
//       })
//     ).toBe(true);
//   });

//   test("Host suffix test should work if no subdomain", () => {
//     expect(
//       new UrlApiPermissionChecks(
//         "https://example.com/inTheMiddleofOurStreet",
//         requestUsersConsent(UsersConsentResponse.Allow)
//       ).doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "*.example.com", paths: ["bogusPath", "inTheMiddleofOurStreet"]}
//         ]
//       })
//     ).toBe(true);
//   });


//   test("Host suffix test bad domain should fail", () => {
//     expect(
//       new UrlApiPermissionChecks(
//         "https://ourhouse.ex-sample.com/inTheMiddleofOurStreet",
//         requestUsersConsent(UsersConsentResponse.Allow)
//       ).doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "*.example.com", paths: ["bogusPath", "ourPathourPathInTheMiddleOfOurStreet"]}
//         ]
//       })
//     ).toBe(false);
//   });

//   test("Host suffix test should work if no subdomain", () => {
//     expect(
//       new UrlApiPermissionChecks(
//         "https://ex-sample.com/inTheMiddleofOurStreet",
//         requestUsersConsent(UsersConsentResponse.Allow)
//       ).doesClientMeetAuthenticationRequirements({
//         allow: [
//           {host: "bogus eentry to make sure we look beyond first entry"},
//           {host: "*.example.com", paths: ["bogusPath", "ourPathourPathInTheMiddleOfOurStreet"]}
//         ]
//       })
//     ).toBe(false);
//   });

  
// });