# ddcocbot

Telegram bot for a Clash of Clans clan. It verifies that a Telegram user owns a clan account (with the in-game API token), stores the link in PostgreSQL, and gives the user a single-use invite link to the clan group.

### Stack

- Telegram Bot API framework: [GramIO](https://gramio.dev/) with [auto-retry](https://gramio.dev/plugins/official/auto-retry.html)
- ORM: [Drizzle](https://orm.drizzle.team/) on [node-postgres](https://node-postgres.com/)
- Runtime: [Bun](https://bun.com/) ≥ 1.3.14 or [Node.js](https://nodejs.org/) ≥ 22.18 (runs the TypeScript sources directly, no build step)
- Lint and format: [Biome](https://biomejs.dev/)

The source uses only erasable TypeScript syntax (`erasableSyntaxOnly`), so Node's built-in type stripping runs it unchanged.

## Configuration

Copy `.env.example` to `.env` and fill in the values. `OWNER_TELEGRAM_ID` defaults to the original owner when unset.

## Development

```bash
docker compose -f docker-compose.dev.yml up -d   # PostgreSQL on 127.0.0.1:5432
bun install
bun run migrate
bun dev                                          # or: npm run dev:node
```

Checks:

```bash
bun run typecheck
bun run lint
bun run test
```

## Migrations

```bash
bun run db:generate   # create a migration from src/db/schema.ts
bun run migrate       # apply migrations (no drizzle-kit needed at runtime)
```

`bun run migrate` uses Drizzle's migrator table `drizzle.__drizzle_migrations`. If a database was created with `drizzle-kit push` instead, that table is empty and the migrator tries to run `0000` again. Check the table before the first `migrate` on such a database.

## Production (Docker)

```bash
docker compose build
docker compose run --rm bot src/db/migrate.ts
docker compose up -d
```

Compose reads `POSTGRES_PASSWORD` from `.env` and passes `.env` and `.env.production` to the bot as environment variables. The image contains no `.env` files.

## Production (FreeBSD)

FreeBSD has no native Docker, so run the bot as an rc.d service. Node.js is the default runtime. Bun 1.3.14 and later also ships FreeBSD builds; set `ddcocbot_runtime="bun"` to use it.

1. Install the packages:

   ```sh
   pkg install node24 npm-node24 postgresql17-server git
   ```

2. Initialize and start PostgreSQL, then create the role and database:

   ```sh
   sysrc postgresql_enable=YES
   service postgresql initdb
   service postgresql start
   su -m postgres -c "createuser -P ddcocbot"
   su -m postgres -c "createdb -O ddcocbot ddcocbot"
   ```

3. Create the service user and install the code:

   ```sh
   pw useradd ddcocbot -d /nonexistent -s /usr/sbin/nologin -c "ddcocbot"
   git clone <repo-url> /usr/local/ddcocbot
   cd /usr/local/ddcocbot && npm ci --omit=dev
   ```

4. Write the environment file. Use the variables from `.env.example`:

   ```sh
   install -m 0600 -o root /dev/null /usr/local/etc/ddcocbot.env
   vi /usr/local/etc/ddcocbot.env
   ```

5. Apply the migrations:

   ```sh
   cd /usr/local/ddcocbot
   node --env-file=/usr/local/etc/ddcocbot.env src/db/migrate.ts
   ```

6. Install and start the service:

   ```sh
   install -m 0555 contrib/freebsd/ddcocbot /usr/local/etc/rc.d/ddcocbot
   sysrc ddcocbot_enable=YES
   service ddcocbot start
   ```

Logs go to syslog with the tag `ddcocbot`. The Clash of Clans API key is bound to IP addresses, so create a key for the public IP of the FreeBSD host.

Biome has no FreeBSD binary. Lint on another platform or in CI. `tsc` (TypeScript 7) and the tests run on FreeBSD.

## License

GPL-3.0. See [LICENSE](LICENSE).
