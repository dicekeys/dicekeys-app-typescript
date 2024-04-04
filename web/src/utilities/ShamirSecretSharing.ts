export interface PointInIntegerSpace<INT extends number | bigint> {
	x: INT;
	y: INT;
}

/**
 * A finite field constructed over a prime p for the integers [0..p-1],
 * such that all mathematical operations are modulo p.
 */
class FiniteField<INT extends number | bigint> {
	readonly prime: INT;
	readonly #zero: INT;
	readonly #one: INT;

	#arrayBufferToGetRandomValues: Uint32Array;

	coerceToTypeOfPrime = (val: number): INT => (typeof this.prime === "number" ? val : BigInt(val)) as INT;

	/**
	 * Construct a finite field over of prime
	 * @param prime The prime over which to define the field (all arithmetic will be modulo this prime)
	 */
	constructor(
		prime: INT,
	) {
		if (typeof prime === "number" && prime > 1 << 21) {
			// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number#number_encoding
			throw new RangeError(`Cannot create finite field for p=${prime}>${1<<26} (2^26) as ` +
			`multiplications could overflow the 52-bit mantissa of JavaScript's number type. `+
			`Use a bigint prime.`)
		}
		this.prime = prime;
		this.#zero = this.coerceToTypeOfPrime(0);
		this.#one = this.coerceToTypeOfPrime(1);
		// Should be twice the length in bits of the prime value.
		// So, instead of diving bits by 32 (the word size), divide by 16
		const primeLog2Ceiling = (typeof prime === "number") ?
			Math.ceil(Math.log2(prime)) : prime.toString(2).length
		this.#arrayBufferToGetRandomValues = new Uint32Array(
			Math.ceil(primeLog2Ceiling / 16)
		);
	}

	/**
	 * Generate a random number uniformly and at random between 0 and
	 * the prime p (this.prime) that defines the finite field used for
	 * secret sharing.
	 * @returns 
	 */
	randomInt = (maxValue: INT = this.prime): INT => {
		crypto.getRandomValues(this.#arrayBufferToGetRandomValues);
		const randomInt = this.#arrayBufferToGetRandomValues.reduce(
			(r, uint) => (r << 32n) | BigInt(uint),
			0n
		);
		const randomModMaxValue = randomInt % BigInt(maxValue);
		return (typeof this.prime === "number" ? Number(randomModMaxValue) : randomModMaxValue) as INT;
	}

	/**
	 * Convert a number to whatever type (number or bigint) is used for operations
	 * within the finite field defined by p (this.prime).
	 * @param val An integer between 0 and p-1 of JavaScript type `number` 
	 * @returns The input value in whatever numeric format (number or bigint) used
	 * by the prime that defines the finite field of this secret sharing implementation.
	 */
	modP = (val: INT) => val < this.prime ? (val) : (val % this.prime) as INT;
	add = (a: INT, b: INT) => this.modP((a as bigint) + (b as bigint) as INT);
	sum = (...values: INT[]) => {
		const [first = this.#zero, ...rest] = values;
		return this.modP(rest.reduce(
			(sum, value) => (sum + (value as bigint)),
			first as bigint
		) as INT);
	}
	subtract = (a: INT, b: INT): INT => {
		const sub = ((a as bigint) - (this.modP(b) as bigint));
		return ( (sub as INT) >= this.#zero ? sub : (sub + (this.prime as bigint)) ) as INT;
	}
	multiply = (a: INT, b: INT) =>
		(((a as bigint) * (b as bigint)) % (this.prime as bigint)) as INT;
	product = ([first, ...rest]: INT[]) =>
		rest.reduce( this.multiply, first ?? this.#one);


	/**
	 * Find the inverse of a number within the finite field defined by prime p
	 * @param n The number to invert.
	 * @returns The inverse i of n in the field defined by field's prime p
	 * 					such that n * i = 1, and so for any y, 0 < y < p,  (y * i) * n = y. 
	 * 
	 * http://en.wikipedia.org/wiki/Modular_multiplicative_inverse#Computation
	 */
	invert = (n: INT): INT => {
		let b = this.prime;
		let [x, y, last_x, last_y] = [this.#zero, this.#one, this.#one, this.#zero] as [INT, INT, INT, INT];
		while (b != this.#zero) {
			const quotient = (typeof n === "number" ? Math.floor(n / b) : n/b) as INT;
			[	n, b,
				x, last_x,
				y, last_y
			] = [
				b, n % b,
				this.subtract(last_x, this.multiply(quotient, x)), x,
				this.subtract(last_y, this.multiply(quotient, y)), y] as [INT, INT, INT, INT, INT, INT];
		}
		return last_x;
	}

	/**
	 * Division in a finite field defined by prime p (mod p) is computed by
	 * multiplying the numerator by the inverse of the denominator.
	 * @param numerator 
	 * @param denominator 
	 * @returns numerator / denominator 
	 */
	divide = (numerator: INT, denominator: INT): INT => {
		return this.multiply(this.modP(numerator), this.invert(this.modP(denominator)));
	}

	/**
	 * Find the y-value for the given x, given n (x, y) points;
	 * k points will define a polynomial of up to kth order.
	 * @param points Existing points on the polynomial (of sufficient number to define the polynomial)
	 * @param atX The x coordinate at which to interpolate the corresponding y.
	 * @returns The y coordinate that forms a point on the polynomial with the provided x coordinate.
	 */
		lagrangeInterpolate = (points: PointInIntegerSpace<INT>[], atX: INT = this.coerceToTypeOfPrime(0)): INT => {
			if (new Set<INT>(points.map( p => p.x)).size < points.length) {
				/* istanbul ignore next */
				throw Error("Redundant points");
			}
			const {numerators, denominators} = points.reduce( (result, {x}) => {
				const otherXValues = points.map( p => p.x ).filter( xi => xi !== x );
				result.numerators.push(this.product(otherXValues.map( o => this.subtract(atX, o) )));
				result.denominators.push( this.product(otherXValues.map( o => this.subtract(x, o) )) );
				return result;
			}, {numerators: [] as INT[], denominators: [] as INT[]});
	
			const productOfAllDenominators:INT = this.product(denominators);
			const sumOfAllNumerators: INT = this.sum( ...numerators.map( (_num_i, i) =>
				// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
				this.divide(this.product([numerators[i]!, productOfAllDenominators, points[i]!.y]), denominators[i]!)
			));
			return this.divide(sumOfAllNumerators, productOfAllDenominators);
		}
}

export class ShamirSecretSharing<INT extends number | bigint> {
	public readonly ff: FiniteField<INT>;

	constructor(
		public readonly prime: INT,
	) {
		this.ff = new FiniteField(prime);
	}

	/**
	 * 
	 * @param shares 
	 * @param atPublicX 
	 * @param minimumNumberOfSharesToRecover 
	 * @returns 
	 */
	recoverSecret = (
		shares: PointInIntegerSpace<INT>[],
		atPublicX: INT = this.ff.coerceToTypeOfPrime(0),
		minimumNumberOfSharesToRecover?: number
	): INT => {
		if (minimumNumberOfSharesToRecover != null && shares.length < minimumNumberOfSharesToRecover) {
			throw new RangeError("Too few shares provided")
		}
		return this.ff.lagrangeInterpolate(shares, atPublicX);
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
			throw new RangeError(`Two or more existing shares have the same x value: ${redundantXValueInExistingShares}`);
		}
		const firstRedundantXValueForNewShares = xValuesOfNewShares.reduce( (result, x) => {
				if (result != null) {
					return result;
				} else if (existingXValues.has(x) ) {
					return x;
				} else {
					existingXValues.add(x);
					return;
				}
			},
			undefined as INT | undefined
		);
		if (firstRedundantXValueForNewShares != null) {
			throw new RangeError(`X value for new share is not unique: ${firstRedundantXValueForNewShares} of ${xValuesOfNewShares.map( x => `${x}`).join(", ")} should not be in ${existingShares.map( ({x}) => `${x}`).join(", ")}`);
		}
		// if (minimumNumberOfSharesToRecover > existingShares.length + xValuesOfNewShares.length) {
		// 	throw new RangeError("There must be at least as many minimum shares as total shares");
		// }
		const points = [...existingShares];
		return xValuesOfNewShares.map( x => {
			const y = points.length < minimumNumberOfSharesToRecover ?
				this.ff.randomInt() :
				this.ff.lagrangeInterpolate(points.slice(0), x);
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

	generateSecretFromMinimumNumberOfShares = (
		initialShares: PointInIntegerSpace<INT>[],
//		numberOfTotalShares: number,
		{
			minimumNumberOfSharesToRecover = initialShares.length,
//			maxXValue = this.ff.prime,
		} : {
			minimumNumberOfSharesToRecover?: number;
			minXValue?: INT;
			maxXValue?: INT;
			generateXValues?: "countingUp" | "randomly"
		}
		,
	) => {
		const newXValues = [] as INT[];
		const newShares = this.generateAdditionalShares(
			initialShares,
			newXValues,
			minimumNumberOfSharesToRecover
		);

		return {initialShares, newShares, }
	}
}

