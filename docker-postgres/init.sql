-- run during first time setup of postgres docker container for development
-- environment variables are not available here
-- tried a custom entrypoint to the container that exports them as well to no avail
\echo '\033[35mrunning database init...\033[0m'

-- Note: Database 'idling_app' is already created by POSTGRES_DB env var
-- We connect to it directly
\echo '\033[35mconnecting to the idling_app database...\033[0m'
\c idling_app;

\echo '\033[35mcreating nextauth required tables...\033[0m'
CREATE TABLE verification_token
(
  identifier TEXT NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  token TEXT NOT NULL,

  PRIMARY KEY (identifier, token)
);

CREATE TABLE accounts
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  type VARCHAR(255) NOT NULL,
  provider VARCHAR(255) NOT NULL,
  "providerAccountId" VARCHAR(255) NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  id_token TEXT,
  scope TEXT,
  session_state TEXT,
  token_type TEXT,

  PRIMARY KEY (id)
);

CREATE TABLE sessions
(
  id SERIAL,
  "userId" INTEGER NOT NULL,
  expires TIMESTAMPTZ NOT NULL,
  "sessionToken" VARCHAR(255) NOT NULL,

  PRIMARY KEY (id)
);

CREATE TABLE users
(
  id SERIAL,
  name VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  "emailVerified" TIMESTAMPTZ,
  image TEXT,
  profile_public BOOLEAN DEFAULT true,
  bio TEXT,
  location VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id)
);

\echo '\033[33mfinished initializing the idling_app database!\033[0m'

\echo '\033[35mcreating migrations tracking table...\033[0m'
CREATE TABLE migrations (
  id SERIAL PRIMARY KEY,
  filename VARCHAR(255) NOT NULL UNIQUE,
  executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN NOT NULL,
  error_message TEXT
);

\echo '\033[33mfinished database initialization!\033[0m'
\echo '\033[36mNote: social posts/submissions tables are not created here; run SQL migrations for full schema.\033[0m'
\q