import { Adapter, AdapterSession, AdapterUser } from 'next-auth/adapters';
import { Pool, PoolConfig } from 'pg';

/**
 * first time signin executes adapter methods in the following order:
 * 1. getUserByAccount
 * 2. getUserByAccount
 * 3. getUserByEmail
 * 4. createUser
 */
export default function PostgresAdapter(
  client: Pool,
  options: PoolConfig = {}
): Adapter {
  return {
    async createUser(user) {
      console.info('createUser---------------------------user', user);
      try {
        // const sql = `
        //   INSERT INTO users (id, name, email, emailVerified, image)
        //   VALUES ($1, $2, $3, $4, $5)
        //   RETURNING id, name, email, emailVerified, image
        // `;
        const sql = `
          INSERT INTO users (id, name, email, emailVerified, image) 
          VALUES ($1, $2, $3, $4, $5) 
        `;
        const result = await client.query(sql, [
          user.id,
          user.name,
          user.email,
          user.emailVerified,
          user.image
        ]);
        console.info('RESULT', result);

        return result.rows[0];
      } catch (err) {
        console.error('--createUser error: ', err);
        return user;
      }
    },
    async getUser(id) {
      console.info('getUser---------------------------id', id);

      try {
        const sql = `select * from users where id = $1`;
        const result = await client.query(sql, [id]);

        return result.rows[0];
      } catch (err) {
        console.error('--getUser error: ', err);
        return;
      }
    },
    async getUserByEmail(email) {
      console.info('getUserByEmail---------------------------email', email);

      try {
        const sql = `select * from users where email = $1`;
        const result = await client.query(sql, [email]);

        return result.rows[0];
      } catch (err) {
        console.error('--getUserByEmail error: ', err);
        return;
      }
    },
    async getUserByAccount({ providerAccountId, provider }) {
      console.info(
        'getUserByAccount---------------------------providerAccountId, provider',
        providerAccountId,
        provider
      );

      try {
        const sql = `
          select * from user
        `;
        // const sql = `
        //   select u.* from users u join accounts a on u.id = a.userId
        //   where a.provider = $1
        //   and a.providerAccountId = $2
        // `;
        const result = await client.query(sql, [provider, providerAccountId]);
        console.info('result', result);
        return result.rows[0];
      } catch (err) {
        console.error('--getUserByAccount error: ', err);
      }
    },
    async updateUser(user) {
      console.info('updateUser---------------------------user', user);

      try {
        const sql = `
          update users
          set name = $1
              email = $2
              emailVerified = $3
              image = $4
          where id = $5
        `;
        const result = await client.query(sql, [
          user.name,
          user.email,
          user.emailVerified,
          user.image,
          user.id
        ]);

        return result.rows[0];
      } catch (err) {
        console.error('--updateUser error: ', err);
        return;
      }
    },
    async linkAccount(account) {
      console.info('linkAccount---------------------------account', account);

      try {
        const sql = `
          insert into accounts (
            userId, 
            type, 
            provider, 
            providerAccountId, 
            access_token,
            expires_at
          )
          values ($1, $2, $3, $4, $5, to_timestamp($6))
        `;

        const params = [
          account.userId,
          account.type,
          account.provider,
          account.providerAccountId,
          account.access_token,
          account.expires_at
        ];

        await client.query(sql, params);

        return account;
      } catch (err) {
        console.error('--linkAccount error: ', err);
        return;
      }
    },
    async createSession({ sessionToken, userId, expires }) {
      console.info(
        'createSession---------------------------sessionToken, userId, expires',
        sessionToken,
        userId,
        expires
      );

      const session: AdapterSession = {} as AdapterSession;

      try {
        const sql = `
          insert into sessions (userId, expires, sessionToken)
          values ($1, $2, $3)
        `;

        await client.query(sql, [userId, expires, sessionToken]);

        session.expires = expires;
        session.userId = userId;
        session.sessionToken = sessionToken;

        return session;
      } catch (err) {
        console.error('--createSession error: ', err);
        return session;
      }
    },
    // @ts-expect-error - this is fucked, look into a diff auth provider
    async getSessionAndUser(sessionToken) {
      console.info(
        'getSessionAndUser---------------------------sessionToken',
        sessionToken
      );

      let session: AdapterSession = {} as AdapterSession;
      let user: AdapterUser = {} as AdapterUser;

      if (sessionToken) {
        try {
          let result;

          result = await client.query(
            'select * from sessions where sessionToken = $1',
            [sessionToken]
          );

          session = result.rows[0];

          console.info('SESSION', session);
          if (session) {
            result = await client.query('select * from users where id = $1', [
              session.userId
            ]);
            user = result.rows[0];

            return {
              session,
              user
            };
          }

          return;
        } catch (err) {
          console.error('--getSessionAndUser error: ', err);
          // return { session, user };
          return;
        }
      }
      // return { session, user };
      return;
    },
    async updateSession({ sessionToken, expires, userId }) {
      console.info(
        'updateSession---------------------------sessionToken, expires, userId',
        sessionToken,
        expires,
        userId
      );

      try {
        const sql = `
        update sessions
          set expires = $1
          sessionToken = $2
        where userId = $3
      `;
        const result = await client.query(sql, [expires, sessionToken, userId]);

        return result.rows[0];
      } catch (error) {
        console.error('--updateSession error: ', error);
        return;
      }
    },
    async deleteSession(sessionToken) {
      console.info(
        'deleteSession---------------------------sessionToken',
        sessionToken
      );

      try {
        const sql = `delete from sessions where sessionToken = $1`;
        await client.query(sql, [sessionToken]);
      } catch (err) {
        console.error('--deleteSession error: ', err);
        return;
      }
    }
  };
}
