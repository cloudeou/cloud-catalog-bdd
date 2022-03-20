module.exports = {
  opusbootstrap: (params) => 
  `UPDATE opus_migration
   SET migrating = true
   WHERE (ecid, location_id, iptv_id) IN (
    SELECT ecid, location_id, iptv_id FROM opus_migration
    WHERE migrated is NULL
    AND migrating is FALSE
    LIMIT 1)
  RETURNING *;`,
  opusuuidremapping: (params) => 
  `UPDATE opus_mailboxes
   SET migrating = true
   WHERE (target_mailbox) IN (
      SELECT target_mailbox FROM opus_mailboxes
      WHERE NOT migrating
      AND NOT remapped
      LIMIT 1)
  RETURNING *;`,
  opusuuid: (params) => 
  `UPDATE opus_uuid_remapping
   SET status = 'in progress'
   WHERE resource_id IN (
    SELECT resource_id from opus_uuid_remapping
    WHERE status = 'skipped'  
    LIMIT 1)
  RETURNING *;`,
  opusvalidation: (params) => 
  `UPDATE opus_migration
    SET migrating = true
    WHERE (ecid, location_id) IN (
    SELECT ecid, location_id FROM opus_migration
    WHERE NOT migrated
    AND NOT migrating
    AND NOT provided
    LIMIT 1)
  RETURNING *;`
}

