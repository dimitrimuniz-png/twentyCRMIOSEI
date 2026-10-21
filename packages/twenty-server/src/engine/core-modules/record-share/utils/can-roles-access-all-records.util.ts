// Every role the caller holds must be allowed to see all records. One
// narrower role keeps the caller on the row policy.
export const canRolesAccessAllRecords = ({
  roleIds,
  roleIdsWithAllRecordsAccess,
}: {
  roleIds: string[];
  roleIdsWithAllRecordsAccess: string[];
}): boolean =>
  roleIds.length > 0 &&
  roleIds.every((roleId) => roleIdsWithAllRecordsAccess.includes(roleId));
