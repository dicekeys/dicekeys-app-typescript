export const BackupStatusCancelled = "cancelled" as const;
export type BackupStatusCancelled = typeof BackupStatusCancelled;;
export const BackupStatusCompletedWithoutValidation = "completed-without-validation" as const;
export type BackupStatusCompletedWithoutValidation = typeof BackupStatusCompletedWithoutValidation;
export const BackupStatusCompletedAndValidated = "completed-and-validated" as const;
export type BackupStatusCompletedAndValidated = typeof BackupStatusCompletedAndValidated;

export type BackupStatus = BackupStatusCancelled | BackupStatusCompletedWithoutValidation | BackupStatusCompletedAndValidated;

