import { ShamirSecretSharing} from "../utilities/ShamirSecretSharing";

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

describe("Shamir Secret Sharing", () => {

	const p = 827514231081199274682194003812398710017109379105423360029n;
  describe(`Test for prime ${p}`, () => {
		const shamir = new ShamirSecretSharing<bigint>(p);
		const secret = 1234n;
		const shares = shamir.generateAdditionalSharesForSecret(0n, secret, [], [1n, 2n, 3n, 4n, 5n, 6n], 3);
		test(`Recover slice 2-5`, () => {
			const recoveredSecret =	shamir.recoverSecret(shares.slice(2, 5));
			expect(recoveredSecret).toStrictEqual(secret);
		});
	});
});