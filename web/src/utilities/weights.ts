export const sum = (numbers: number[]): number => 
  numbers.reduce( (sum, item) => sum + item, 0);
export const weightsToFractionalProportions = (...weights: number[]): number[] => {
  const totalWeight = sum(weights);
  // only a hardware geek would write javascript that uses an inverse to avoid dividing within a loop,
  // but since we have to prevent the divide-by-zero case anyway...
  const inverseDenominator = totalWeight !== 0 ? (1 / totalWeight) : 1;
  return weights.map( weight => weight * inverseDenominator );
}