export function rangeStartingAt0(count: number) {
	return [...Array(count).keys()];
}

export function rangeFromTo(fromInclusive: number, toInclusive: number = 0) {
	return [...Array(toInclusive + 1 - fromInclusive).keys()].map((x) => x + fromInclusive);
}

