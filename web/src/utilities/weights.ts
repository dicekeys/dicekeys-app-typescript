export const sum = (numbers: readonly number[]): number => 
  numbers.reduce( (sum, item) => sum + item, 0);

type TupleOf<T, N extends number> = N extends N ? number extends N ? T[] : _TupleOf<T, N, []> : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R['length'] extends N ? R : _TupleOf<T, N, [T, ...R]>;

export function weightsToFractionalProportions<N extends number>(...weights: TupleOf<number, N>): TupleOf<number, N> {
  const totalWeight = sum(weights);
  // only a hardware geek would write javascript that uses an inverse to avoid dividing within a loop,
  // but since we have to prevent the divide-by-zero case anyway...
  const inverseDenominator = totalWeight !== 0 ? (1 / totalWeight) : 1;
  return weights.map( weight => weight * inverseDenominator ) as TupleOf<number, N>;
}