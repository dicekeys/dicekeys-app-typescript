export const HandGeneratedBackupMediumStickers = "stickers" as const;
export type HandGeneratedBackupMediumStickers = typeof HandGeneratedBackupMediumStickers;
export const HandGeneratedBackupMediumDice = "dice" as const;
export type HandGeneratedBackupMediumDice = typeof HandGeneratedBackupMediumDice;
export const MachineGeneratedBackupMediumPrintout = "printout" as const;
export type MachineGeneratedBackupMediumPrintout = typeof MachineGeneratedBackupMediumPrintout;
export const MetaBackupMediumShares = "shares" as const;
export type MetaBackupMediumShares = typeof MetaBackupMediumShares;

export type HandGeneratedBackupMedium = HandGeneratedBackupMediumStickers | HandGeneratedBackupMediumDice;
export type PhysicalBackupMedium = HandGeneratedBackupMedium | MachineGeneratedBackupMediumPrintout;
export type BackupMedium = PhysicalBackupMedium | MetaBackupMediumShares;


export type SourceOfDiceKeyShare = "scanned" | "pseudorandom" | "calculated";