import * as crypto from 'node:crypto';

interface Point<INT extends number | bigint> {
	x: INT;
	y: INT;
}

const range = (from: number, count: number): number[] =>
	[...Array(count).keys()].map( i => from + i );



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

	// Division in integers modulus p means finding the inverse of the
	// denominator modulo p and then multiplying the numerator by this
	// inverse (Note: inverse of A is B such that A*B % p == 1). This can
	// be computed via the extended Euclidean algorithm
	// http://en.wikipedia.org/wiki/Modular_multiplicative_inverse#Computation
 	extendedGCD = (a: INT, b: INT): [INT, INT] => {
	// console.log(`extendedGCD a, b`, a, b);
	let [x, y, last_x, last_y] = [this.#zero, this.#one, this.#one, this.#zero] as [INT, INT, INT, INT];
	while (b != this.#zero) {
		const quotient = (typeof a === "number" ? Math.floor(a / b) : a/b) as INT;
		// console.log(`a, b, a/b x y`, a, b, quotient, x, y);
		// [a, b] = [b, a % b] as [INT, INT];
		// [x, last_x] = [this.subModP(last_x, this.multiplyModP(quotient, x)), x] as [INT, INT];
		// [y, last_y] = [this.subModP(last_y, this.multiplyModP(quotient, y)), y] as [INT, INT];
		[	a, b,
			x, last_x,
			y, last_y
		] = [
			b, a % b,
			this.subModP(last_x, this.multiplyModP(quotient, x)), x,
			this.subModP(last_y, this.multiplyModP(quotient, y)), y] as [INT, INT, INT, INT, INT, INT];
	}
	// console.log(`extendedGCD result`, last_x, last_y);
	return [last_x, last_y]
}

	// Compute num / den modulo prime p
	divideModP = (numerator: INT, denominator: INT): INT => {
		// To explain this, the result will be such that: 
		// den * _divmod(num, den, p) % p == num
		//
		if (numerator > this.prime) {
			numerator = numerator % this.prime as INT;
		}
		if (denominator > this.prime) {
			denominator = denominator % this.prime as INT;
		}
		const [inv] = this.extendedGCD(denominator, this.prime);
		const result = this.multiplyModP(numerator, inv);
		if (this.multiplyModP(result, denominator) !== numerator) {
			throw new Error("Division failed");
		}
		return result;
	}

	modP = (val: INT) => val % this.prime as INT;
	addModP = (a: INT, b: INT) =>
		(((a as bigint) + (b as bigint)) % (this.prime as bigint)) as INT;
	sumModP = (...values: INT[]) => {
		const [first = this.#zero, ...rest] = values;
		return rest.reduce(
			(sum, value) => ((sum as bigint) + (value as bigint)),
			first as bigint
		) % (this.prime as bigint) as INT;
	}
	subModP = (a: INT, b: INT): INT => {
		let sub = ((a as bigint) - (b as bigint));
		if (sub < 0) {
			sub += this.prime as bigint;
		}
		return sub as INT;
	}

	multiplyModP = (a: INT, b: INT) =>
		(((a as bigint) * (b as bigint)) % (this.prime as bigint)) as INT;
	productModP = ([first, ...rest]: INT[]) =>
		rest.reduce( this.multiplyModP, first ?? this.#one);
	
	// Evaluates polynomial (coefficient tuple) at x, used to generate a
	// shamir pool in make_random_shares below.
	evalAt = (poly: INT[], x: INT) =>
		[...poly].reverse().reduce( (resultOfPriorIteration, coefficient): INT =>
			this.addModP( this.multiplyModP(resultOfPriorIteration, x), coefficient),
			this.#zero
		);

	// productOfInputs = (vals: INT[]): INT => // upper-case PI -- product of inputs
	// 	vals.reduce( (productOfInputs, v) => productOfInputs * v as INT, this.#one );
	// 
	// Find the y-value for the given x, given n (x, y) points;
	// k points will define a polynomial of up to kth order.
	// 
	lagrangeInterpolate = (points: Point<INT>[], atX: INT = this.#zero): INT => {
		console.log(`lagrangeInterpolate`, atX, points);
		if (new Set<INT>(points.map( p => p.x)).size < points.length) {
			throw Error("Redundant points");
		} else if (points.length < this.minimumNumberOfSharesToRecover) {
			throw RangeError(`Cannot interpolate ${this.minimumNumberOfSharesToRecover} degree polynomial from ${points.length} points`);
		}

		const {numerators, denominators} = points.reduce( (result, {x}) => {
			const other_x_values = points.map( p => p.x ).filter( xi => xi !== x );
			result.numerators.push( this.productModP(other_x_values.map( o => this.subModP(atX, o) )));
			result.denominators.push( this.productModP(other_x_values.map( o => this.subModP(x, o) )) );
			return result;
		}, {numerators: [] as INT[], denominators: [] as INT[]});

		const productOfAllDenominators:INT = this.productModP(denominators);
		const sumOfAllNumerators: INT = this.sumModP( ...numerators.map( (_num_i, i) =>
			this.divideModP(this.productModP([numerators[i]!, productOfAllDenominators, points[i]!.y]), denominators[i]!)
		));
		return this.divideModP(sumOfAllNumerators, productOfAllDenominators);
	}

	lagrangeInterpolate2 = (points: Point<INT>[], atX: INT = this.#zero): INT => {
		console.log(`lagrangeInterpolate2`, atX, points);
		if (new Set<INT>(points.map( p => p.x)).size < points.length) {
			throw Error("Redundant points");
		} else if (points.length < this.minimumNumberOfSharesToRecover) {
			throw RangeError(`Cannot interpolate ${this.minimumNumberOfSharesToRecover} degree polynomial from ${points.length} points`);
		}

		const product = (vals: INT[], sub: INT | undefined, skip: number | undefined): INT => {
			// p := big.NewInt(1)
			let aggregateProduct = this.#one;
			// for i := range vals {
			for (let i = 0; i < vals.length; i++) {
				if (i === skip) {
					continue
				}
				// v := cp(vals[i])
				let v = vals[i]!;
				if (sub != null) {
					v = this.subModP(sub, v);
				}
				// p.Mul(p, v)
				aggregateProduct = this.multiplyModP(aggregateProduct, v);
			}
			return aggregateProduct
		}
		// nums := make([]*big.Int, len(x))
		// dens := make([]*big.Int, len(x))

		// for i := range x {
		// 	nums[i] = product(x, x0, i)
		// 	dens[i] = product(x, x[i], i)
		// }
		const xs = points.map( ({x}) => x );
		const numerators = xs.map( (_, i) => product(xs, atX, i) );
		const denominators = xs.map( (_, i) => product(xs, points[i]!.x, i) );

		// den := product(dens, nil, -1)
		const den = product(denominators, undefined, undefined)

		// num := big.NewInt(0)
		let num = this.#zero;
		// for i := range nums {
		[...numerators.keys()].forEach( i => {
		// 	nums[i].Mul(nums[i], den)
			numerators[i] = this.multiplyModP(numerators[i]!, den);
		// 	nums[i].Mul(nums[i], y[i])
			numerators[i] = this.multiplyModP(numerators[i]!, points[i]!.y);
		// 	nums[i].Mod(nums[i], modulus)
		// 	v := divmod(nums[i], dens[i], modulus)
			const v = this.divideModP(numerators[i]!, denominators[i]!)
		// 	if v == nil {
		// 		return nil // x values are not distinct.
		// 	}
		// 	num.Add(num, v)
			num = this.addModP(num, v);
		// }
		})

		// y0 = divmod(num, den, modulus)
		const y0 = this.divideModP(num, den);
		// y0.Add(y0, modulus)
		// y0.Mod(y0, modulus)
		// return y0
		return y0;
	}

	// Recover the secret from share points
	// (points (x,y) on the polynomial).
	//
	// def recover_secret(shares, prime=_PRIME):
	recoverSecret = (shares: Point<INT>[]): INT => {
		if (shares.length < this.minimumNumberOfSharesToRecover) {
			throw new RangeError("not enough shares provided")
			//    raise ValueError("need at least three shares")
		}
		// x_s, y_s = zip(*shares)
		// const points: [INT, INT][] = ( (typeof this.prime === "number") ? 
		// 	shares.map( (y, index) => [index + 1, y] ) : 
		// 	shares.map( (y, index) => [BigInt(index + 1), y])) as [INT, INT][];
		console.log(`recoverSecret`, shares, this.#zero);
		const l1 = this.lagrangeInterpolate(shares);
		const l2 = this.lagrangeInterpolate2(shares);
		if (l1 != l2) {
			console.log(`l1 != l2`, l1, l2);
		} else {
			console.log(`lagrange algorithms agree`);
		}
		return l1;
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
	): Point<INT>[] => {
		if (this.minimumNumberOfSharesToRecover > totalSharesToGenerate) {
			throw new RangeError("There must be at least as many minimum shares as total shares");
		}
		// poly = [secret] + [_RINT(prime - 1) for i in range(minimum - 1)]
		const poly: INT[] = [secret];
		while (poly.length < this.minimumNumberOfSharesToRecover) {
			poly.push(this.randomIntModP());
		}
		const testAtZero = this.evalAt(poly, this.#zero);
		if (testAtZero !== secret) {
			console.log(`Fail`, testAtZero, secret);
			throw new Error(`failed ${secret}===${testAtZero}`);
		}
		// points = [(i, _eval_at(poly, i, prime))
		//	for i in range(1, shares + 1)]
		const shares = range(1, totalSharesToGenerate).map( i => {
			const x = ((typeof this.prime === "number") ? i : BigInt(i)) as INT;
			return ({x: x, y: this.evalAt(poly, x)});
		});
		return shares;
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