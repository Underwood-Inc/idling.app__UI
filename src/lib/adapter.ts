import { createLogger } from '@/lib/logging';
import type {
  Adapter,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from '@auth/core/adapters';
import type { Pool } from 'pg';

const logger = createLogger({
  context: {
    component: 'Adapter',
    module: 'lib'
  }
});

export function mapExpiresAt(account: any): any {
  const expires_at: number = parseInt(account.expires_at);

  return {
    ...account,
    expires_at
  };
}

export default function CustomPostgresAdapter(client: Pool): Adapter {
  return {
    async createVerificationToken(
      verificationToken: VerificationToken
    ): Promise<VerificationToken> {
      const { identifier, expires, token } = verificationToken;
      const sql = `
        INSERT INTO verification_token ( identifier, expires, token ) 
        VALUES ($1, $2, $3)
        `;
      await client.query(sql, [identifier, expires, token]);

      return verificationToken;
    },
    async useVerificationToken({
      identifier,
      token
    }: {
      identifier: string;
      token: string;
    }): Promise<VerificationToken> {
      const sql = `delete from verification_token
      where identifier = $1 and token = $2
      RETURNING identifier, expires, token `;
      const result = await client.query(sql, [identifier, token]);

      return result.rowCount !== 0 ? result.rows[0] : null;
    },

    async createUser(user: Omit<AdapterUser, 'id'>) {
      const { name, email, emailVerified, image } = user;

      // Clean modern user creation for NextAuth integration
      const sql = `
        INSERT INTO users (
          name, 
          email, 
          "emailVerified", 
          image, 
          profile_public,
          created_at
        ) 
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP) 
        RETURNING id, name, email, "emailVerified", image, profile_public, created_at`;

      const result = await client.query(sql, [
        name,
        email,
        emailVerified,
        image,
        true // Default to public profile
      ]);

      return result.rows[0];
    },
    async getUser(id) {
      const sql = `
        SELECT 
          id, name, email, "emailVerified", image, profile_public, 
          created_at, spacing_theme, pagination_mode
        FROM users 
        WHERE id = $1`;
      try {
        const result = await client.query(sql, [id]);

        return result.rowCount === 0 ? null : result.rows[0];
      } catch (e) {
        return null;
      }
    },
    async getUserByEmail(email) {
      const sql = `
        SELECT 
          id, name, email, "emailVerified", image, profile_public, 
          created_at, spacing_theme, pagination_mode
        FROM users 
        WHERE email = $1`;
      const result = await client.query(sql, [email]);

      return result.rowCount !== 0 ? result.rows[0] : null;
    },
    async getUserByAccount({
      providerAccountId,
      provider
    }): Promise<AdapterUser | null> {
      // First, check if the user preference columns exist
      let sql = `
        SELECT 
          u.id, u.name, u.email, u."emailVerified", u.image, u.profile_public, 
          u.created_at,
          a."providerAccountId" 
        FROM users u 
        JOIN accounts a ON u.id = a."userId"
        WHERE a.provider = $1 AND a."providerAccountId" = $2`;

      try {
        // Try to include user preference columns if they exist
        const columnCheckSql = `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' 
          AND column_name IN ('spacing_theme', 'pagination_mode')`;

        const columnCheck = await client.query(columnCheckSql);
        const hasPreferenceColumns = columnCheck.rowCount === 2;

        if (hasPreferenceColumns) {
          sql = `
            SELECT 
              u.id, u.name, u.email, u."emailVerified", u.image, u.profile_public, 
              u.created_at, u.spacing_theme, u.pagination_mode,
              a."providerAccountId" 
            FROM users u 
            JOIN accounts a ON u.id = a."userId"
            WHERE a.provider = $1 AND a."providerAccountId" = $2`;
        }

        const result = await client.query(sql, [provider, providerAccountId]);

        if (result.rowCount === 0) {
          return null;
        }

        const user = result.rows[0];

        // Set default values for preference columns if they don't exist
        if (!hasPreferenceColumns) {
          user.spacing_theme = 'cozy';
          user.pagination_mode = 'traditional';
        }

        // Attach providerAccountId to the user object for JWT callback
        return {
          ...user,
          providerAccountId: user.providerAccountId
        };
      } catch (error) {
        logger.error('Error in getUserByAccount', error as Error, {
          provider,
          providerAccountId
        });
        return null;
      }
    },
    async updateUser(user: Partial<AdapterUser>): Promise<AdapterUser> {
      const fetchSql = `select * from users where id = $1`;
      const query1 = await client.query(fetchSql, [user.id]);
      const oldUser = query1.rows[0];

      const newUser = {
        ...oldUser,
        ...user
      };

      const { id, name, email, emailVerified, image } = newUser;

      // ✅ CRITICAL: Sync username changes from OAuth providers
      // This ensures that when users relogin with updated provider usernames,
      // our database stays synchronized for reliable profile URL generation
      const updateSql = `
        UPDATE users set
        name = $2, email = $3, "emailVerified" = $4, image = $5
        where id = $1
        RETURNING *
      `;
      const query2 = await client.query(updateSql, [
        id,
        name,
        email,
        emailVerified,
        image
      ]);

      // Log username changes for monitoring
      if (oldUser.name !== name) {
        logger.info('Username synced from provider', {
          userId: id,
          oldUsername: oldUser.name,
          newUsername: name,
          provider: 'oauth'
        });
      }

      return query2.rows[0];
    },
    async linkAccount(account) {
      const sql = `
      insert into accounts 
      (
        "userId", 
        provider, 
        type, 
        "providerAccountId", 
        access_token,
        expires_at,
        refresh_token,
        id_token,
        scope,
        session_state,
        token_type
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      returning
        id,
        "userId", 
        provider, 
        type, 
        "providerAccountId", 
        access_token,
        expires_at,
        refresh_token,
        id_token,
        scope,
        session_state,
        token_type
      `;

      const params = [
        account.userId,
        account.provider,
        account.type,
        account.providerAccountId,
        account.access_token,
        account.expires_at,
        account.refresh_token,
        account.id_token,
        account.scope,
        account.session_state,
        account.token_type
      ];

      const result = await client.query(sql, params);

      // Note: We no longer store provider_account_id in users table
      // OAuth provider ID is only stored in accounts table

      return mapExpiresAt(result.rows[0]);
    },
    async createSession({ sessionToken, userId, expires }) {
      if (userId === undefined) {
        throw Error(`userId is undef in createSession`);
      }

      const sql = `insert into sessions ("userId", expires, "sessionToken", "sessiontoken")
      values ($1, $2, $3, $3)
      RETURNING id, "sessionToken", "userId", expires`;

      const result = await client.query(sql, [userId, expires, sessionToken]);

      return result.rows[0];
    },

    async getSessionAndUser(sessionToken: string | undefined): Promise<{
      session: AdapterSession;
      user: AdapterUser;
    } | null> {
      if (sessionToken === undefined) {
        return null;
      }

      const result1 = await client.query(
        `select * from sessions where "sessionToken" = $1`,
        [sessionToken]
      );

      if (result1.rowCount === 0) {
        return null;
      }

      let session: AdapterSession = result1.rows[0];

      const result2 = await client.query('select * from users where id = $1', [
        session.userId
      ]);

      if (result2.rowCount === 0) {
        return null;
      }

      const user = result2.rows[0];

      return {
        session,
        user
      };
    },
    async updateSession(
      session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>
    ): Promise<AdapterSession | null | undefined> {
      const { sessionToken } = session;
      const result1 = await client.query(
        `select * from sessions where "sessionToken" = $1`,
        [sessionToken]
      );

      if (result1.rowCount === 0) {
        return null;
      }

      const originalSession: AdapterSession = result1.rows[0];
      const newSession: AdapterSession = {
        ...originalSession,
        ...session
      };
      const sql = `
        UPDATE sessions set
        expires = $2
        where "sessionToken" = $1
        `;
      const result = await client.query(sql, [
        newSession.sessionToken,
        newSession.expires
      ]);

      return result.rows[0];
    },
    async deleteSession(sessionToken) {
      const sql = `delete from sessions where "sessionToken" = $1`;
      await client.query(sql, [sessionToken]);
    },
    async unlinkAccount(partialAccount) {
      const { provider, providerAccountId } = partialAccount;
      const sql = `delete from accounts where "providerAccountId" = $1 and provider = $2`;
      await client.query(sql, [providerAccountId, provider]);
    },
    async deleteUser(userId: string) {
      await client.query(`delete from users where id = $1`, [userId]);
      await client.query(`delete from sessions where "userId" = $1`, [userId]);
      await client.query(`delete from accounts where "userId" = $1`, [userId]);
    }
  };
}
