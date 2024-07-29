import { Account } from 'next-auth';
import {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from 'next-auth/adapters';
import sql from './db';

/**
 * first time signin executes adapter methods in the following order:
 * 1. getUserByAccount
 * 2. getUserByAccount
 * 3. getUserByEmail
 * 4. createUser
 */
// export default function PostgresAdapter(
//   client: Pool,
//   options: PoolConfig = {}
// ): Adapter {
//   return {
//     async createUser(user) {
//       console.info('createUser---------------------------user', user);
//       try {
//         // const sql = `
//         //   INSERT INTO users (id, name, email, emailVerified, image)
//         //   VALUES ($1, $2, $3, $4, $5)
//         //   RETURNING id, name, email, emailVerified, image
//         // `;
//         const sql = `
//           INSERT INTO users (id, name, email, emailVerified, image)
//           VALUES ($1, $2, $3, $4, $5)
//         `;
//         const result = await client.query(sql, [
//           user.id,
//           user.name,
//           user.email,
//           user.emailVerified,
//           user.image
//         ]);
//         console.info('RESULT', result);

//         return result.rows[0];
//       } catch (err) {
//         console.error('    createUser error: ', err);
//         return;
//       }
//     },
//     async getUser(id) {
//       console.info('getUser---------------------------id', id);

//       try {
//         const sql = `select * from users where id = $1`;
//         const result = await client.query(sql, [id]);

//         return result.rows[0];
//       } catch (err) {
//         console.error('    getUser error: ', err);
//         return;
//       }
//     },
//     async getUserByEmail(email) {
//       console.info('getUserByEmail---------------------------email', email);

//       try {
//         const sql = `select * from users where email = $1`;
//         const result = await client.query(sql, [email]);

//         return result.rows[0];
//       } catch (err) {
//         console.error('    getUserByEmail error: ', err);
//         return;
//       }
//     },
//     async getUserByAccount({ providerAccountId, provider }) {
//       console.info(
//         'getUserByAccount---------------------------providerAccountId, provider',
//         providerAccountId,
//         provider
//       );

//       try {
//         const sql = `
//           select * from user
//         `;
//         // const sql = `
//         //   select u.* from users u join accounts a on u.id = a.userId
//         //   where a.provider = $1
//         //   and a.providerAccountId = $2
//         // `;
//         const result = await client.query(sql, [provider, providerAccountId]);
//         console.info('result', result);
//         return result.rows[0];
//       } catch (err) {
//         console.error('    getUserByAccount error: ', err);
//       }
//     },
//     async updateUser(user) {
//       console.info('updateUser---------------------------user', user);

//       try {
//         const sql = `
//           update users
//           set name = $1
//               email = $2
//               emailVerified = $3
//               image = $4
//           where id = $5
//         `;
//         const result = await client.query(sql, [
//           user.name,
//           user.email,
//           user.emailVerified,
//           user.image,
//           user.id
//         ]);

//         return result.rows[0];
//       } catch (err) {
//         console.error('    updateUser error: ', err);
//         const adapterUser: AdapterUser = {
//           email: '',
//           emailVerified: null,
//           id: ''
//         };

//         return adapterUser;
//       }
//     },
//     async linkAccount(account) {
//       console.info('linkAccount---------------------------account', account);

//       try {
//         const sql = `
//           insert into accounts (
//             userId,
//             type,
//             provider,
//             providerAccountId,
//             access_token,
//             expires_at
//           )
//           values ($1, $2, $3, $4, $5, to_timestamp($6))
//         `;

//         const params = [
//           account.userId,
//           account.type,
//           account.provider,
//           account.providerAccountId,
//           account.access_token,
//           account.expires_at
//         ];

//         await client.query(sql, params);

//         return account;
//       } catch (err) {
//         console.error('    linkAccount error: ', err);
//         return;
//       }
//     },
//     async createSession({ sessionToken, userId, expires }) {
//       console.info(
//         'createSession---------------------------sessionToken, userId, expires',
//         sessionToken,
//         userId,
//         expires
//       );

//       const session: AdapterSession = {} as AdapterSession;

//       try {
//         const sql = `
//           insert into sessions (userId, expires, sessionToken)
//           values ($1, $2, $3)
//         `;

//         await client.query(sql, [userId, expires, sessionToken]);

//         session.expires = expires;
//         session.userId = userId;
//         session.sessionToken = sessionToken;

//         return session;
//       } catch (err) {
//         console.error('    createSession error: ', err);
//         return session;
//       }
//     },
//     // @ts-expect-error - this is fucked, look into a diff auth provider
//     async getSessionAndUser(sessionToken) {
//       console.info(
//         'getSessionAndUser---------------------------sessionToken',
//         sessionToken
//       );

//       let session: AdapterSession = {} as AdapterSession;
//       let user: AdapterUser = {} as AdapterUser;

//       if (sessionToken) {
//         try {
//           let result;

//           result = await client.query(
//             'select * from sessions where sessionToken = $1',
//             [sessionToken]
//           );

//           session = result.rows[0];

//           console.info('SESSION', session);
//           if (session) {
//             result = await client.query('select * from users where id = $1', [
//               session.userId
//             ]);
//             user = result.rows[0];

//             return {
//               session,
//               user
//             };
//           }

//           return;
//         } catch (err) {
//           console.error('    getSessionAndUser error: ', err);
//           // return { session, user };
//           return null;
//         }
//       }
//       // return { session, user };
//       return null;
//     },
//     async updateSession({ sessionToken, expires, userId }) {
//       console.info(
//         'updateSession---------------------------sessionToken, expires, userId',
//         sessionToken,
//         expires,
//         userId
//       );

//       try {
//         const sql = `
//         update sessions
//           set expires = $1
//           sessionToken = $2
//         where userId = $3
//       `;
//         const result = await client.query(sql, [expires, sessionToken, userId]);

//         return result.rows[0];
//       } catch (error) {
//         console.error('    updateSession error: ', error);
//         return;
//       }
//     },
//     async deleteSession(sessionToken) {
//       console.info(
//         'deleteSession---------------------------sessionToken',
//         sessionToken
//       );

//       try {
//         const sql = `delete from sessions where sessionToken = $1`;
//         await client.query(sql, [sessionToken]);
//       } catch (err) {
//         console.error('    deleteSession error: ', err);
//         return;
//       }
//     }
//   };
// }

export default function PostgresAdapter(): Adapter {
  const createUser = async (
    user: Omit<AdapterUser, 'id'>
  ): Promise<AdapterUser> => {
    console.info('==========createUser==========');

    const users = await sql`
      INSERT INTO users (id, name, email, emailVerified, image)
      VALUES (${user.name!}, ${user.email}, ${user.image!}) 
      RETURNING id, name, email, emailVerified, image`;
    console.info('users', users);
    const newUser: AdapterUser = {
      ...users[0],
      id: users[0].id.toString(),
      emailVerified: users[0].emailVerified,
      email: users[0].email
    };

    return newUser;
    // return user;
  };

  const getUser = async (id: string) => {
    console.info('==========getUser==========');

    const users = await sql`
      SELECT *
      FROM users
      WHERE id = ${id};
    `;

    return {
      ...users[0],
      id: users[0].id.toString(),
      emailVerified: users[0].emailVerified,
      email: users[0].email
    };
  };

  const getUserByEmail = async (email: string) => {
    console.info('==========getUserByEmail==========');

    const users = await sql`SELECT * FROM users WHERE email = ${email}`;

    return users[0]
      ? {
          ...users[0],
          id: users[0].id.toString(),
          emailVerified: users[0].emailVerified,
          email: users[0].email
        }
      : null;
  };

  const getUserByAccount = async ({
    provider,
    providerAccountId
  }: {
    provider: string;
    providerAccountId: string;
  }): Promise<AdapterUser | null> => {
    console.info('==========getUserByAccount==========');
    // const query = await sql`select * from submissions`; // THIS DOES WORK SO WTF IS UP WITH CLOUDFLARE????
    // console.info('query: ', query);

    // const users = await sql`
    //   SELECT *
    //   FROM users u join accounts a on 'u.id' = 'a.userId'
    //   WHERE 'a.provider' = '${provider}'
    //   AND 'a.providerAccountId' = '${providerAccountId}'
    // `;
    // console.info('users', users);
    // const user =
    //   users && users[0]
    //     ? {
    //         email: users[0].email,
    //         emailVerified: users[0].emailVerified,
    //         id: users[0].id
    //       }
    //     : null;

    // return user;
    return null;
  };

  const updateUser = async (
    user: Partial<AdapterUser> & Pick<AdapterUser, 'id'>
  ): Promise<AdapterUser> => {
    console.info('==========updateUser==========');

    const updatedUsers = await sql`
      UPDATE users
      SET name = ${user.name!}, email = ${user.email!}, image = ${user.image!}
      WHERE id = ${user.id}
      RETURNING id, name, email, image;
    `;
    const updatedUser: AdapterUser = {
      ...updatedUsers[0],
      id: updatedUsers[0].id.toString(),
      emailVerified: updatedUsers[0].emailVerified,
      email: updatedUsers[0].email
    };

    return updatedUser;
  };

  const deleteUser = async (userId: string) => {
    console.info('==========deleteUser==========');

    await sql`DELETE FROM users WHERE id = ${userId}`;

    return;
  };

  const createSession = async ({
    sessionToken,
    userId,
    expires
  }: {
    sessionToken: string;
    userId: string;
    expires: Date;
  }): Promise<AdapterSession> => {
    console.info('==========createSession==========');

    const expiresString = expires.toDateString();
    await sql`
      INSERT INTO sessions (userId, expires, sessionToken) 
      VALUES (${userId}, ${expiresString}, ${sessionToken})
    `;
    const createdSession: AdapterSession = {
      sessionToken,
      userId,
      expires
    };

    return createdSession;
  };

  const getSessionAndUser = async (
    sessionToken: string
  ): Promise<{ session: AdapterSession; user: AdapterUser } | null> => {
    console.info('==========getSessionAndUser==========');
    const query = await sql`select * from submissions`; // THIS DOES WORK SO WTF IS UP WITH CLOUDFLARE????
    console.info('test query result: ', query);
    const session = await sql`
      SELECT * 
      FROM sessions 
      WHERE sessionToken = ${sessionToken}
    `;

    console.info('session', session);

    if (session.length) {
      const users = await sql`
        SELECT * 
        FROM users 
        WHERE id = ${session[0].userId}
      `;
      const expiresDate = new Date(session[0].expires);
      const sessionAndUser: { session: AdapterSession; user: AdapterUser } = {
        session: {
          sessionToken: session[0].sessionToken,
          userId: session[0].userId,
          expires: expiresDate
        },
        user: {
          id: users[0].id,
          emailVerified: users[0].emailVerified,
          email: users[0].email,
          name: users[0].name,
          image: users[0].image
        }
      };

      return sessionAndUser;
    }

    return null;
  };

  const updateSession = async (
    session: Partial<AdapterSession> & Pick<AdapterSession, 'sessionToken'>
  ): Promise<AdapterSession | null | undefined> => {
    console.info('==========updateSession==========');

    console.info(
      'Unimplemented function! updateSession in vercelPostgresAdapter. Session:',
      JSON.stringify(session)
    );

    return;
  };

  const deleteSession = async (sessionToken: string) => {
    console.info('==========deleteSession==========');

    await sql`
      DELETE FROM auth_sessions
      WHERE sessionToken = ${sessionToken};
    `;

    return;
  };

  const linkAccount = async (
    account: AdapterAccount
  ): Promise<AdapterAccount | null | undefined> => {
    console.info('==========linkAccount==========');

    await sql`
      INSERT INTO accounts (
        userId, 
        type, 
        provider, 
        providerAccountId, 
        refresh_token,
        access_token,
        expires_at,
        id_token
        scope,
        token_type,
      ) 
      VALUES (
        ${account.userId}, 
        ${account.type}, 
        ${account.provider},
        ${account.providerAccountId}, 
        ${account.refresh_token!},
        ${account.access_token!}, 
        to_timestamp(${account.expires_at!}),
        ${account.id_token!}
        ${account.scope!},
        ${account.token_type!},
      )
    `;

    return account;
  };

  const unlinkAccount = async ({
    providerAccountId,
    provider
  }: {
    providerAccountId: Account['providerAccountId'];
    provider: Account['provider'];
  }) => {
    console.info('==========unlinkAccount==========');

    await sql`
      DELETE FROM accounts 
      WHERE provider_account_id = ${providerAccountId} AND provider_id = ${provider}}
    `;
    return;
  };

  const createVerificationToken = async ({
    identifier,
    expires,
    token
  }: VerificationToken): Promise<VerificationToken | null | undefined> => {
    console.info('==========createVerificationToken==========');

    // const { rows } = await sql`
    //     INSERT INTO verification_tokens (identifier, token, expires)
    //     VALUES (${identifier}, ${token}, ${expires.toString()})`;
    // const createdToken: VerificationToken = {
    //   identifier: rows[0].identifier,
    //   token: rows[0].token,
    //   expires: rows[0].expires
    // };
    // return createdToken;
    return;
  };

  //Return verification token from the database and delete it so it cannot be used again.
  const useVerificationToken = async ({
    identifier,
    token
  }: {
    identifier: string;
    token: string;
  }) => {
    console.info('==========useVerificationToken==========');

    // const { rows } = await sql`
    //     SELECT * FROM verification_tokens
    //     WHERE identifier = ${identifier}
    //     AND token = ${token} AND expires > NOW()`;
    // await sql`
    //     DELETE FROM verification_tokens
    //     WHERE identifier = ${identifier}
    //     AND token = ${token}`;
    // return {
    //   expires: rows[0].expires,
    //   identifier: rows[0].identifier,
    //   token: rows[0].token
    // };
    return;
  };

  return {
    createUser,
    getUser,
    updateUser,
    getUserByEmail,
    getUserByAccount,
    deleteUser,
    getSessionAndUser,
    createSession,
    updateSession,
    deleteSession,
    createVerificationToken,
    // useVerificationToken,
    linkAccount,
    unlinkAccount
  };
}
