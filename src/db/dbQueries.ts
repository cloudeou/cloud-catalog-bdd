export const setMigratedFlag = (ecid: string, location_id: string): string =>
  `UPDATE opus_migration SET migrated = true WHERE ecid=${ecid} AND location_id=${location_id}`;

export const resetCustomerMigratingFlag = (ecid: string, location_id: string): string =>
  `UPDATE opus_migration SET migrating = false WHERE ecid=${ecid} AND location_id=${location_id}`;

export const setCustomerMigrationError = (error: string, ecid: string, location_id: string) =>
  `UPDATE opus_migration SET error='${error}' WHERE ecid=${ecid} AND location_id=${location_id}`;
