
export const FramesOfReferenceForReallyBigNumbers: [number, string, string][] = [
  [1.5*(10**56), "grams of matter in the observable universe", "https://en.wikipedia.org/wiki/Observable_universe"],
//  [1.5*(10**53), "kilograms of matter in the observable universe", "https://en.wikipedia.org/wiki/Observable_universe"],
  [10**50, "atoms that make up the Earth", "https://www.fnal.gov/pub/science/inquiring/questions/atoms.html"],
  [4.6 * (10**46), "water molecules in Earth's oceans", "https://www.quora.com/How-many-water-molecules-are-on-and-in-the-earth"],
  [1 * (10**44), "molecules of air in Earth's atmosphere", "https://www.newscientist.com/article/mg15020308-500-the-last-word/"],
  [6 * (10 ** 27) * 7 * (10 ** 9), "atoms in all of the people on Earth", "https://foresight.org/Nanomedicine/Ch03_1.php"],
  [5 * (10**30), "living cells in all of Earth's plants and animals", "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4466264/"]
];

export const describeFrameOfReferenceForReallyBigNumber = (reallyBigNumber: number): string => {
  for (var [frameOfReferenceNumber, frameOfReferenceUnits, _link] of FramesOfReferenceForReallyBigNumbers) {
    if (reallyBigNumber > frameOfReferenceNumber) {
      const multipleOfFrameOfReferenceUnits =
        Math.floor(reallyBigNumber / frameOfReferenceNumber);
      return `${multipleOfFrameOfReferenceUnits.toLocaleString()} times the number of ${frameOfReferenceUnits}`
    }
  }
  return reallyBigNumber.toLocaleString();
}