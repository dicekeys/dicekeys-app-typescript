import * as crypto from 'node:crypto';

export interface PointInIntegerSpace<INT extends number | bigint> {
	x: INT;
	y: INT;
}

// const range = (from: number, count: number): number[] =>
// 	[...Array(count).keys()].map( i => from + i );

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

	Int = (val: number): INT => (typeof this.prime === "number" ? val : BigInt(val)) as INT;
	modP = (val: INT) => val < this.prime ? (val) : (val % this.prime) as INT;
	addModP = (a: INT, b: INT) => this.modP((a as bigint) + (b as bigint) as INT);
//		(((a as bigint) + (b as bigint)) % (this.prime as bigint)) as INT;
	sumModP = (...values: INT[]) => {
		const [first = this.#zero, ...rest] = values;
		return this.modP(rest.reduce(
			(sum, value) => ((sum as bigint) + (value as bigint)),
			first as bigint
		) as INT);
	}
	subModP = (a: INT, b: INT): INT => {
		const sub = ((a as bigint) - (this.modP(b) as bigint));
		return ( (sub as INT) >= this.#zero ? sub : (sub + (this.prime as bigint)) ) as INT;
		// if (sub < 0) {
		// 	sub += this.prime as bigint;
		// }
		// return sub as INT;
	}
	multiplyModP = (a: INT, b: INT) =>
		(((a as bigint) * (b as bigint)) % (this.prime as bigint)) as INT;
	productModP = ([first, ...rest]: INT[]) =>
		rest.reduce( this.multiplyModP, first ?? this.#one);

	// Division in integers modulus p means finding the inverse of the
	// denominator modulo p and then multiplying the numerator by this
	// inverse (Note: inverse of A is B such that A*B % p == 1). This can
	// be computed via the extended Euclidean algorithm
	// http://en.wikipedia.org/wiki/Modular_multiplicative_inverse#Computation
	inverseModP = (a: INT): INT => {
		let b = this.prime;
		let [x, y, last_x, last_y] = [this.#zero, this.#one, this.#one, this.#zero] as [INT, INT, INT, INT];
		while (b != this.#zero) {
			const quotient = (typeof a === "number" ? Math.floor(a / b) : a/b) as INT;
			[	a, b,
				x, last_x,
				y, last_y
			] = [
				b, a % b,
				this.subModP(last_x, this.multiplyModP(quotient, x)), x,
				this.subModP(last_y, this.multiplyModP(quotient, y)), y] as [INT, INT, INT, INT, INT, INT];
		}
		// console.log(`extendedGCD result`, last_x, last_y);
		return last_x;
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
		const result = this.multiplyModP(numerator, this.inverseModP(denominator));
		// if (this.multiplyModP(result, denominator) !== numerator) {
		// 	throw new Error("Division failed");
		// }
		return result;
	}

	// Evaluates polynomial (coefficient tuple) at x, used to generate a
	// shamir pool in make_random_shares below.
	evalAt = (poly: INT[], x: INT) =>
		[...poly].reverse().reduce( (resultOfPriorIteration, coefficient): INT =>
			this.addModP( this.multiplyModP(resultOfPriorIteration, x), coefficient),
			this.#zero
		);


	// Find the y-value for the given x, given n (x, y) points;
	// k points will define a polynomial of up to kth order.
	// 
	lagrangeInterpolate = (points: PointInIntegerSpace<INT>[], atX: INT = this.#zero): INT => {
		if (new Set<INT>(points.map( p => p.x)).size < points.length) {
			throw Error("Redundant points");
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


	recoverSecret = (shares: PointInIntegerSpace<INT>[], atPublicX: INT = this.#zero, minimumNumberOfSharesToRecover?: number): INT => {
		if (minimumNumberOfSharesToRecover != null && shares.length < minimumNumberOfSharesToRecover) {
			throw new RangeError("not enough shares provided")
		}
		return this.lagrangeInterpolate(shares, atPublicX);
	}

	generateAdditionalShares = (
		existingShares: PointInIntegerSpace<INT>[],
		xValuesOfNewShares: INT[],
		minimumNumberOfSharesToRecover: number
	): PointInIntegerSpace<INT>[] => {
		const existingXValues = new Set<INT>();
		const redundantXValueInExistingShares = existingShares.reduce( (result, {x}) => {
			if (existingXValues.has(x) && result == null) {
				return x;
			} else {
				existingXValues.add(x);
				return result;
			}
		}, undefined as INT | undefined);
		if (redundantXValueInExistingShares != null) {
			throw new RangeError("Two or more existing shares have the same x value: `${redundantXValueInExistingShares}`");
		}
		const firstRedundantXValueForNewShares = xValuesOfNewShares.reduce( (result, x) => {
			if (existingXValues.has(x) && result == null) {
				return x;
			} else {
				existingXValues.add(x);
				return result;
			}
		}, undefined as INT | undefined);
		if (firstRedundantXValueForNewShares != null) {
			throw new RangeError("X value for new share is not unique: `${redundantXValueInExistingShares}`")
		}
		if (minimumNumberOfSharesToRecover > existingShares.length + xValuesOfNewShares.length) {
			throw new RangeError("There must be at least as many minimum shares as total shares");
		}
		const points = [...existingShares];
		return xValuesOfNewShares.map( x => {
			const y = points.length < minimumNumberOfSharesToRecover ?
				this.randomIntModP() :
				this.lagrangeInterpolate(points.slice(0), x);
			const point = {x, y};
			points.push(point);
			return point;
		})
	}

	generateAdditionalSharesForSecret = (
		publicX: INT,
		secretY: INT,
		existingShares: PointInIntegerSpace<INT>[],
		xValuesOfNewShares: INT[],
		minimumNumberOfSharesToRecover: number,
	): PointInIntegerSpace<INT>[] => this.generateAdditionalShares([
			{x: publicX, y: secretY} as PointInIntegerSpace<INT>,
			...existingShares
		], xValuesOfNewShares, minimumNumberOfSharesToRecover)
}
