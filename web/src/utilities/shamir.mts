import * as crypto from 'node:crypto';

const range = (from: number, count: number): number[] =>
	[...Array(count).keys()].map( i => from + i );

// Division in integers modulus p means finding the inverse of the
// denominator modulo p and then multiplying the numerator by this
// inverse (Note: inverse of A is B such that A*B % p == 1). This can
// be computed via the extended Euclidean algorithm
// http://en.wikipedia.org/wiki/Modular_multiplicative_inverse#Computation
const extendedGCD = <INT extends bigint | number>(a: INT, b: INT): [INT, INT] => {
	const [zero, one] = ((typeof a === "number") ? [0, 1] as const : [0n, 1n]) as [INT, INT];
	let [x, y, last_x, last_y] = [zero, one, one, zero] as [INT, INT, INT, INT];
	while (b != zero) {
		const quot = a; // b
		[a, b] = [b, a % b] as [INT, INT];
		[x, last_x] = [last_x - quot * x, x] as [INT, INT];
		[y, last_y] = [last_y - quot * y, y] as [INT, INT];
		// I believe everything the four lines above can be replaced with:
		// [a, b, x, last_x, y, last_y] = [b, a % b, last_x - a * x, x, last_y - a * y, y] as [INT, INT, INT, INT, INT, INT];
	}
	return [last_x, last_y]
}

const log2Ceiling = <INT extends number | bigint>(value: INT): number => {
	if (typeof value === "number") {
		return Math.ceil(Math.log2(value));
	} else {
		return value.toString(2).length;
	}
}

export class ShamirSecretSharing<INT extends number | bigint> {
	readonly #zero: INT;
	readonly #one: INT;
	readonly #thirtyTwo: INT;

	#arrayBufferToGetRandomValues: Uint32Array;

	constructor(
		public readonly prime: INT,
		public readonly minimumNumberOfSharesToRecover: number = 1
	) {
		this.#zero = ((typeof prime === "number") ? 0 : 0n) as INT;
		this.#one = ((typeof prime === "number") ? 1 : 1n) as INT;
		this.#thirtyTwo = ((typeof prime === "number") ? 32 : 32n) as INT;
		// Should be twice the length in bits of the prime value.
		// So, instead of diving bits by 32 (the word size), divide by 16
		this.#arrayBufferToGetRandomValues = new Uint32Array(
			Math.ceil(log2Ceiling(this.prime) / 16)
		);
	}

	// Compute num / den modulo prime p
	divideModP = (num: INT, den: INT): INT => {
		// To explain this, the result will be such that: 
		// den * _divmod(num, den, p) % p == num
		//
		if (num < 0) {
			num = ((num as bigint) % (this.prime as bigint)) + (this.prime as bigint) as INT;
		}
		if (num > this.prime) {
			num = num % this.prime as INT;
		}
		const [inv] = extendedGCD(den, this.prime);
		return num * inv as INT;
	}

	addModP = (a: INT, b: INT) =>
		(((a as bigint) + (b as bigint)) % (this.prime as bigint)) as INT;
	sumModP = (first: INT, ...rest: INT[]) =>
		rest.reduce(
			(sum, value) => ((sum as bigint) + (value as bigint)),
			first as bigint
		) % (this.prime as bigint) as INT;

	multiplyModP = (a: INT, b: INT) =>
		(((a as bigint) * (b as bigint)) % (this.prime as bigint)) as INT;
	productModP = ([first, ...rest]: INT[]) =>
		rest.reduce( this.multiplyModP, first ?? this.#one);
	
	// Evaluates polynomial (coefficient tuple) at x, used to generate a
	// shamir pool in make_random_shares below.
	evalAt = (poly: INT[], x: INT) =>
		poly.reverse().reduce( (resultOfPriorIteration, coefficient): INT =>
			((resultOfPriorIteration * x) + coefficient % this.prime) as INT,
			this.#zero
		);

	// productOfInputs = (vals: INT[]): INT => // upper-case PI -- product of inputs
	// 	vals.reduce( (productOfInputs, v) => productOfInputs * v as INT, this.#one );
	// 
	// Find the y-value for the given x, given n (x, y) points;
	// k points will define a polynomial of up to kth order.
	// 
	lagrangeInterpolate = (points: [INT, INT][], atX: INT = this.#zero): INT => {
		console.log(`lagrangeInterpolate`, atX, points);
		if (points.length < this.minimumNumberOfSharesToRecover) {
			throw RangeError(`Cannot interpolate ${this.minimumNumberOfSharesToRecover} degree polynomial from ${points.length} points`);
		}
		const nums: INT[] = []; // avoid inexact division
		const dens: INT[] = [];
	//    for i in range(k):
		// const {} = this.productOfInputs.reduce( (r, [x, y], index) => {
		// 		const other_x_values = points.map( ([xi, _y]) => xi ).filter( xi => xi !== x ); //  list(x_s)
		// 		r.numerators.push(other_x_values);

		// 	}, 
		// 	{	numerators: [] as INT[], denominators: [] as INT[] }
		// );
		for (let i = 0; i < points.length; i++) {
			const other_x_values = points.map( ([x, _y]) => x ); //  list(x_s)
			// cur = others.pop(i)
			const current_x = other_x_values.splice(i, 1)[0]!;
			console.log(`cur/others`, current_x, other_x_values);
			//  nums.append(PI( x - o for o in others))
			nums.push(this.productModP(other_x_values.map( o => atX - o as INT )));
			//  dens.append(PI(cur - o for o in others))
			dens.push(this.productModP(other_x_values.map( o => current_x - o as INT )))
		}
		// den = PI(dens)
		const den:INT = this.productModP(dens);
		// num = sum([_divmod(nums[i] * den * y_s[i] % p, dens[i], p)
		//           for i in range(k)])
		const num: INT = nums.reduce( (sum, _num_i, i) => {
				const numerator = this.productModP([nums[i]!, den, points[i]![1]]);
				const denominator = dens[i]!;
				const resultOfDivision = this.divideModP(numerator, denominator);
				console.log(`loop`, resultOfDivision, sum, numerator, denominator,  nums[i], den, points[i]![1]);
				return this.addModP(sum, resultOfDivision);
					// sum,
					// this.divideModP(
					// 	this.productModP([nums[i]!, den, points[i]![1]]),
					// 	dens[i]!
					// )
			}, this.#zero) as INT
		console.log(`lagrangeInterpolate nums/dens/den,num`, nums, dens, den, num);
		return this.divideModP(num, den);
	}

	// Recover the secret from share points
	// (points (x,y) on the polynomial).
	//
	// def recover_secret(shares, prime=_PRIME):
	recoverSecret = (shares: INT[]): INT => {
		if (shares.length < this.minimumNumberOfSharesToRecover) {
			throw new RangeError("not enough shares provided")
			//    raise ValueError("need at least three shares")
		}
		// x_s, y_s = zip(*shares)
		const points: [INT, INT][] = ( (typeof this.prime === "number") ? 
			shares.map( (y, index) => [index + 1, y] ) : 
			shares.map( (y, index) => [BigInt(index + 1), y])) as [INT, INT][];
		console.log(`recoverSecret`, shares, this.#zero, points);
		return this.lagrangeInterpolate(points);
	}

	randomIntModP = (): INT => {
		crypto.getRandomValues(this.#arrayBufferToGetRandomValues);
		const randomInt = this.#arrayBufferToGetRandomValues.reduce( (r, uint) => {
				const uInt = typeof this.prime === "number" ? uint : BigInt(uint);
				return ( ((r as bigint) << (this.#thirtyTwo as bigint)) | ( uInt as bigint) ) as INT
			},
			this.#zero
		) as INT;
		return randomInt % this.prime as INT;
	}

	// 
	// Generates a random shamir pool for a given secret, returns share points.
	// 
	generateShares = (
		secret: INT,
		totalSharesToGenerate: number
	): INT[] => {
		if (this.minimumNumberOfSharesToRecover > totalSharesToGenerate) {
			throw new RangeError("There must be at least as many minimum shares as total shares");
		}
		// poly = [secret] + [_RINT(prime - 1) for i in range(minimum - 1)]
		const poly: INT[] = [secret];
		while (poly.length < this.minimumNumberOfSharesToRecover) {
			poly.push(this.randomIntModP());
		}
		// points = [(i, _eval_at(poly, i, prime))
		//	for i in range(1, shares + 1)]
		const points = range(1, totalSharesToGenerate).map( i =>
			this.evalAt(poly, ((typeof this.prime === "number") ? i : BigInt(i)) as INT)
		);
		return points
	}



}
// const _RINT = functools.partial(random.SystemRandom().randint, 0)

// 12th Mersenne Prime
const TwelfthMersennePrime: bigint = 2n ** 127n - 1n;
// 12th Mersenne Prime
// const TwelfthMersennePrimeNumber: number = 2 ** 127 - 1;




const stest = () => {
	const shamir = new ShamirSecretSharing(TwelfthMersennePrime, 3);
  const secret = 1234n;
  const shares = shamir.generateShares(secret, 6);

	console.log('Secret:', secret)
	console.log('Shares:', shares);
	console.log('Secret recovered from minimum subset of shares:',
		shamir.recoverSecret(shares.slice(0, 3))
	);
	// console.log('Secret recovered from a different minimum subset of shares:',
	// 	shamir.recoverSecret(shares.slice(3,6))
	// );
}

stest();