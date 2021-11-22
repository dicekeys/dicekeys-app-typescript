import { canonicalizeRecipeJson } from "../dicekeys/canonicalizeRecipeJson"
import { BuiltInRecipes } from "../dicekeys/StoredRecipe";

type TestCase = {input: string, expectedOutput: string};
const TestCase = (input: string, expectedOutput: string): TestCase => ({input, expectedOutput});

const doNotModifyBuiltInRecipeTestCases: TestCase[] =
	BuiltInRecipes.map( ({recipeJson}) => ({
		input: recipeJson, expectedOutput: recipeJson
	}) );

const customTestCases: TestCase[] = [
	// Order fields correctly
	TestCase(`{"#":3,"allow":[{"host":"*.example.com"}]}`,`{"allow":[{"host":"*.example.com"}],"#":3}`),
	// Order fields correctly
	TestCase(
		`{"#":3,"allow":[{"host":"*.example.com"}],"purpose":"Life? Don't talk to me about life!" }`,
		`{"purpose":"Life? Don't talk to me about life!","allow":[{"host":"*.example.com"}],"#":3}`
	),
	// Order fields in sub-object (allow) correctly
	TestCase(
		`{"allow":[{"paths":["lo", "yo"],"host":"*.example.com"}]}`,
		`{"allow":[{"host":"*.example.com","paths":["lo","yo"]}]}`,
	),
	// Remove white space correctly
	TestCase(` {  "allow" : [  {"host"${"\n"}:"*.example.com"}${"\t"} ]    }${"\n\n"}`,`{"allow":[{"host":"*.example.com"}]}`),
	// Lots of fields to order correctly, including an empty object with all-caps field name
	TestCase(
		`{"allow":[{"paths":["lo", "yo"],"host":"*.example.com"}],"#":3, "purpose":"Don't know", "lengthInChars":3, "lengthInBytes": 15, "UNANTICIPATED_CAPITALIZED_FIELD":{}}`,
		`{"purpose":"Don't know","UNANTICIPATED_CAPITALIZED_FIELD":{},"allow":[{"host":"*.example.com","paths":["lo","yo"]}],"lengthInBytes":15,"lengthInChars":3,"#":3}`,
	),
	// Lots of fields to order correctly, including an empty array with all-caps field name
	TestCase(
		`{"allow":[{"paths":["lo", "yo"],"host":"*.example.com"}],"#":3, "purpose":"Don't know", "lengthInChars":3, "lengthInBytes": 15, "UNANTICIPATED_CAPITALIZED_FIELD":[ ] }`,
		`{"purpose":"Don't know","UNANTICIPATED_CAPITALIZED_FIELD":[],"allow":[{"host":"*.example.com","paths":["lo","yo"]}],"lengthInBytes":15,"lengthInChars":3,"#":3}`,
	),
]

describe("canonicalizeRecipeJson", () => {

	doNotModifyBuiltInRecipeTestCases.forEach( ({input, expectedOutput}) => {
		test(`Should not modify ${input}`, () => {
			const output = canonicalizeRecipeJson(input)
			expect (output).toStrictEqual(expectedOutput);
		});	
	});

	customTestCases.forEach( ({input, expectedOutput}) => {
		test(`Custom test case ${input}`, () => {
			const output = canonicalizeRecipeJson(input)
			expect (output).toStrictEqual(expectedOutput);
		});	
	});

	// // Only uncomment when debugging tests
	// test.only(`For use debugging broken tests`, () => {
	// 		const {input, expectedOutput} = TestCase(
	// 			`{}`,
	// 			`{}`
	// 		);
	// 		const output = canonicalizeRecipeJson(input)
	// 		expect (output).toStrictEqual(expectedOutput);
	// });

});
