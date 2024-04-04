
export class PseudoRandom {
	
	#key: CryptoKey;
	#counter: bigint;

	static createFrom32ByteArrayBuffer = async (keyAsArrayBuffer32Bytes: ArrayBuffer) => {
		return new PseudoRandom(await crypto.subtle.importKey("raw", keyAsArrayBuffer32Bytes, "AES-CTR", false, ["encrypt"]));
	}
	static createFromStringSeed = async (seedAsString: string) =>
		PseudoRandom.createFrom32ByteArrayBuffer( await crypto.subtle.digest("SHA-256", new TextEncoder().encode(seedAsString)) );

	getArrayBuffer = async (numberOf16ByteBlocks: number = 1) => {
		// Important -- this increment must execute before any *await* statements
		// lest we might use the same counter for multiple buffers
		let mutableCounterBeforeIncrement = this.#counter; 
		this.#counter += BigInt( 16 * numberOf16ByteBlocks );

		// Convert the counter into a 16-byte array to use as an initialization vector
		const counterAsBigEndianUint8ArrayOf16Bytes = new Uint8Array(16);
		for (let i = counterAsBigEndianUint8ArrayOf16Bytes.length - 1; i >= 0; i--) {
			counterAsBigEndianUint8ArrayOf16Bytes[i] = Number( mutableCounterBeforeIncrement & 0xFFn );
			mutableCounterBeforeIncrement >>= 8n;
		}
		// We'll encrypt an array of zeros to get a random array of bytes
		return await window.crypto.subtle.encrypt(
			{
				name: "AES-CTR",
				counter: counterAsBigEndianUint8ArrayOf16Bytes,
				length: 128,
			},
			this.#key,
			new Uint8Array(Array(numberOf16ByteBlocks * 16).fill(0)),
		);
	}

	getBigUInt = async(sizeAsMultipleOf128Bits = 1) =>
			new Uint32Array(await this.getArrayBuffer(sizeAsMultipleOf128Bits)).reduce( (b, u) => (b << 32n) + BigInt(u), 0n);
	getBigUInts = async(count: number, sizeAsMultipleOf128Bits: number = 1): Promise<bigint[]> =>
			new Uint32Array(await this.getArrayBuffer(sizeAsMultipleOf128Bits * count)).reduce( (r, u, i) => {
					r.current = (r.current << 32n) + BigInt(u);
					if ( (i + 1) % (4 * sizeAsMultipleOf128Bits) === 0) {
						r.finished.push(r.current);
						r.current = 0n;
					}
					return r;
				}, {current: 0n, finished: [] as bigint[]}
			).finished;

	getUInt256 = () => this.getBigUInt(2);
	getUInts256 = (count: number, mod?: bigint) => mod == null ? this.getBigUInts(count, 2) :
		this.getBigUInts(count, 2).then( bigInts => bigInts.map( x=> x % mod) );
	getUInt128 = () => this.getBigUInt(1);
	getUInt = async (upperLimitExclusive?: number) =>
		(await this.getUInt128()) % (upperLimitExclusive != null ? BigInt(upperLimitExclusive) : (BigInt(Number.MAX_SAFE_INTEGER) + 1n));

	constructor(key: CryptoKey, counter: bigint = 0n) {
		this.#key = key;
		this.#counter = counter;
	}
}