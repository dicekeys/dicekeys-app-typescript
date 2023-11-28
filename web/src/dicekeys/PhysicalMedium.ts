export enum PhysicalMedium {
  stickers = "stickers",
  dice = "dice",
  printout = "printout",
}
export type PhysicalMediumString = typeof PhysicalMedium[keyof typeof PhysicalMedium];


export type SourceOfDiceKeyShare = "scanned" | "pseudorandom" | "calculated";