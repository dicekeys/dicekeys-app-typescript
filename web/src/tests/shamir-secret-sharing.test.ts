import { ShamirSecretSharing } from "../utilities/ShamirSecretSharing";

// FUTURE: Remove 7 following lines after moving to Node 19+
import { webcrypto } from 'node:crypto';
import { rangeFromTo } from "../utilities/range";
if (!globalThis?.crypto) {
	globalThis.crypto = webcrypto as typeof globalThis["crypto"];
}

// interface RecoveryTestCaseBase<INT extends number | bigint> {
// 	p: INT;
// 	points: PointInIntegerSpace<INT>[];
// 	findAtX: INT;
// }

// interface RecoveryTestCaseSuccess<INT extends number | bigint> extends RecoveryTestCaseBase<INT> {
// 	secret: INT;
// }
// interface RecoveryTestCaseFailure<INT extends number | bigint> extends RecoveryTestCaseBase<INT> {
// 	exception: {
// 		prototypeName ?: string;
// 		messageIncludes?: string;
// 	}
// }
// type RecoveryTestCase<INT extends number | bigint> = RecoveryTestCaseSuccess<INT> | RecoveryTestCaseFailure<INT>

interface TestCase<INT extends number | bigint> {
	p: INT,
	secret: INT;
}

const combinations = <T>(items: T[], count: number): T[][] =>
	(count === 0) ? [] :
	(count === 1) ? items.map( item => ([item])) :
		items.slice(0, 1-count).reduce( ( results, item, index) =>
			([...results, ...(( count === 1 ) ? [[item]] : combinations(items.slice(index+1), count -1).map( c => ([item, ...c])))])
		, [] as T[][]);

describe("Shamir Secret Sharing", () => {

	const simpleTestCases = [
		{p: 4965085386487195648093164022874392260102656274632540160107n, secret: 1234n},
		{p: 4965085386487195648093164022874392260102656274632540160107n, secret: 827514231081199274682194003812398710017109379105423360029n},
		{p: 827514231081199274682194003812398710017109379105423360029n, secret: 1234n},
		{p: 65521n, secret: 1234n},
		{p: 65521, secret: 1234},
		{p: 65537n, secret: 1234n},
		{p: 65537, secret: 1234},
	] as TestCase<number | bigint>[];


	simpleTestCases.forEach(({p, secret}) => {
		const shamir = new ShamirSecretSharing(p);
		describe(`Test for prime ${p}`, () => {
			// Test over range of 2-7 shares
			const TestOverNumberOfSharesN = rangeFromTo(3, 7);
			TestOverNumberOfSharesN.forEach( N => {
				// Test minimum number of shares K over range 2..N.
				const MinMinShares = 2;
				const TestOverMinimumNumberOfSharesK = rangeFromTo(MinMinShares, N);
				TestOverMinimumNumberOfSharesK.forEach( K => {
					describe(`${K} of ${N}`, () => {
						const shareXValues = [...Array(N).keys()].map( (x) => shamir.ff.coerceToTypeOfPrime(x + 1) )
						const shares = shamir.generateAdditionalSharesForSecret(shamir.ff.coerceToTypeOfPrime(0), secret, [], shareXValues, K);
						// Test recovery for all possible combinations os K of N shares.
						const shareCombinations = combinations(shares, K);
						shareCombinations.map( sharesUsedForRecovery => {
							test(`Recover from shares at x=${sharesUsedForRecovery.map( share => `${share.x}`).join(", ")}`, () => {
								const recoveredSecret =	shamir.recoverSecret(sharesUsedForRecovery);
								expect(recoveredSecret).toStrictEqual(secret);
							});							
						});
					});
				});
			});
		});
	});	

	test(`Forbids primes as numbers when should be bigints`, () => {
		expect(() => { new ShamirSecretSharing(4294967296); }).toThrow("overflow");
	})

	test(`Throws if not enough shares`, () => {
		expect(() => { 
			const shamir = new ShamirSecretSharing<number>(13);
			shamir.recoverSecret([], 0, 2);
		}).toThrow("shares");
	})

});