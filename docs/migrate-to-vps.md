# Move Aligned's database from Supabase to a remote server

Prepared plan; no remote connection, export, restore, or production switch has been performed. The destination host and source connection still need to be identified.

## Scope

Keep the web app on Vercel and move its PostgreSQL database to a server you control. Aligned uses Passport/bcrypt and PostgreSQL sessions rather than Supabase Auth. Its document and communication integrations store links, not Supabase Storage objects.

Move the application tables and their sequences, constraints, and indexes: `users`, `projects`, `project_members`, `action_items`, `documents`, `deadlines`, `channels`, and `eoi_requests`. Include `session` if preserving existing sessions is desired and it exists. Include `ai_usage` if already deployed. Preserve the existing `SESSION_SECRET` if preserving sessions.

Inspect the source database before choosing the dump scope. A `public`-schema dump is suitable only after confirming that the schema belongs to Aligned and has no Supabase-specific policy/function/extension dependencies. Do not copy Supabase platform schemas blindly. A schema/table-filtered dump does not automatically include dependencies outside its scope.

## Connect to the server

Obtain the server's address, SSH username, port, OS, and authentication method from its hosting console. Use an existing key or enter the password at SSH's prompt; do not put a password in the command or commit a private key.

```bash
ssh -p SSH_PORT SSH_USER@SERVER_ADDRESS
# If the host uses an existing key file:
ssh -i /absolute/path/to/existing-key -p SSH_PORT SSH_USER@SERVER_ADDRESS
```

If SSH reports an unknown host key, compare its fingerprint with the hosting console before accepting it. Do not disable host-key checking. A successful login is enough to start a read-only inventory of the OS, existing services, storage, firewall, PostgreSQL version, and current databases.

## Source connection

Resume the source project if paused. In Supabase's **Connect** dialog, copy the direct connection fields or the session-pooler fields on port **5432** if the migration machine only supports IPv4. The transaction pooler on port 6543 is not the migration connection.

Record hostname, username, database, and port without publishing the password. Download the project's CA certificate and use it to verify the TLS connection. Install official PostgreSQL client tools compatible with the source server; `pg_dump` cannot dump a server with a newer major version than the client. Choose a target server version at least as new as the source for this migration.

## Rehearsal and final copy

1. Create a dedicated empty PostgreSQL database and application role on the destination. Inspect existing services before installing or changing anything. Configure durable storage, verified TLS for Vercel connections, authenticated access, and backups. An SSH tunnel is useful for administration but does not give a Vercel function a database connection.
2. Inspect source table dependencies, policies, extensions, sequences, sizes, and major version. Rehearse the export and restore using a dedicated staging database. Resolve platform-specific dependencies before attempting the final transfer.
3. For the final copy, temporarily stop application writes, including registrations and EOI submissions. Disable Vercel preview environments and any other writer that still points at the source database. Keep writes stopped through verification and the connection switch. A consistent dump alone does not capture later writes.
4. Export the approved scope to a private file with restrictive permissions. For an inspected, Aligned-only `public` schema, the command shape is:

   ```bash
   umask 077
   PGSSLMODE=verify-full PGSSLROOTCERT=/absolute/path/to/source-ca.crt \
     pg_dump --host=SOURCE_HOST --port=5432 --username=SOURCE_USER \
       --dbname=postgres --password --format=custom --schema=public \
       --no-owner --no-acl --file=/private/path/aligned.dump
   ```

   The password is entered at the prompt. Inspect warnings and the archive's object list. The archive contains user accounts, password hashes, and project data; keep it private. Do not add it to this repository.

5. Transfer the archive over the verified SSH connection to a private destination directory, then restore it into the **empty** staging/final database with the intended owner:

   ```bash
   pg_restore --dbname=aligned --username=aligned_app --password \
     --no-owner --no-acl --exit-on-error --single-transaction \
     /private/path/aligned.dump
   psql --dbname=aligned --username=aligned_app --password \
     --set=ON_ERROR_STOP=1 --single-transaction \
     --file=migrations/ai_usage.sql
   ```

   These command shapes assume execution on the destination, with local PostgreSQL authentication configured. Adjust the socket/host and TLS fields after inspecting that server. They do not create the role or database. Do not use `--clean` to overwrite an existing database.

6. Compare source and destination table counts, sequence values, constraints, and indexes while writes remain stopped. Test existing account sign-in, project membership, old timelines, session storage, and the new reviewed-timeline workflow. Counts alone are insufficient verification. Verify that a nonmember cannot access another team's project and that AI quotas survive service restarts.

## Vercel switch

Set `DATABASE_URL` to the new, certificate-verified PostgreSQL endpoint in the intended Vercel environment. Remove the old `SUPABASE_DATABASE_URL` **in that environment**: the current code and Drizzle configuration prefer it over `DATABASE_URL`. Keep the production session secret and AI/SMTP settings intact.

Use a PostgreSQL role dedicated to this application, with access only to its database. Vercel must be able to reach the endpoint over TLS; do not solve reachability by allowing unauthenticated database access or disabling certificate verification. Choose connection-pool limits after checking the target's connection ceiling and Vercel concurrency.

Deploy the staged application change, smoke-test it with writes still stopped, and then reopen writes. Updating an environment variable requires a new Vercel deployment to affect the running app. Test preview deployments against staging, not against the production database.

## Backups and rollback

Before cutover, verify that backups are scheduled and an independent restore works. Keep the source database and the private export during the agreed rollback window.

Before writes reopen, rollback can restore the previous Vercel connection variables and application deployment. After writes reach the new database, switching back immediately would lose those new writes: stop writes and reconcile/copy the new data first. Do not delete the old Supabase project as part of this migration.

## References

- [Supabase connection modes](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [PostgreSQL pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [PostgreSQL pg_restore](https://www.postgresql.org/docs/current/app-pgrestore.html)
- [PostgreSQL TLS verification](https://www.postgresql.org/docs/current/libpq-ssl.html)
- [node-postgres TLS configuration](https://node-postgres.com/features/ssl)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)
