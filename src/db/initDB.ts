export default `
create table IF NOT EXISTS opus_migration
(
    ecid         integer,
    location_id  integer,
    iptv_id      text,
    mediaroom_id text,
    created_date timestamp default now()::timestamp,
    migrating    boolean default false,
    migrated     boolean default null,
    error        text default ''
);
`;
