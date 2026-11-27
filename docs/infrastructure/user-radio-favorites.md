# User radio favorites (cloud)

Song and station favorites for signed-in users persist in PostgreSQL and sync across devices. IndexedDB in the browser is a cache and offline fallback only.

## Schema

Migration `migrations/0062-create-user-radio-favorites.sql`:

- `user_radio_station_favorites` — `user_id`, `station_name`, `stream_url`, `favorited_at`
- `user_radio_song_favorites` — `user_id`, `song_key`, display metadata, `station_name`, `station_genre`, `saved_at`

## Sign-out / mount / account switch

See [auth-client-session.md](./auth-client-session.md). `purgeUserScopedClientStorage` clears radio favorite IDB stores on anonymous mount, sign-out, and account switch (not only on radio sign-out).

## Run migrations manually

### Windows PowerShell (local `.env.local`)

From the `idling.app__UI` project root:

```powershell
pnpm migrations:run
```

Apply pending SQL files only:

```powershell
tsx scripts/migrations.ts run
```

### Docker Compose

The app container entrypoint runs `pnpm migrations:run` on startup (`docker-entrypoint.sh`). To run migrations yourself against the compose Postgres service:

```powershell
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d postgres
pnpm migrations:run
```

### CI

GitHub Actions quality workflows start a Postgres service; run `pnpm migrations:run` in job setup when integration tests need the new tables.

## API

- `GET` / `PUT` `/api/radio/favorites/stations` — requires session
- `GET` / `PUT` `/api/radio/favorites/songs` — requires session

CLAD: repository interfaces in `src/widgets/radio-player/radioFavoritesRepository.ts`, Postgres adapter in `src/plugs/postgres/`, in-memory adapter in `src/plugs/memory/`, HTTP client in `src/widgets/radio-player/radioFavoritesHttpClient.ts`.