export const hammingDistance = (a: number, b: number): number => {
  let distance: number = 0;
  while (a != 0 || b != 0) {
    distance += ((a ^ b) & 1);
    a = a >> 1;
    b = b >> 1;
  }
  return distance;
}
