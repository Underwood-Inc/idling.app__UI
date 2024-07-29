import { Account } from 'next-auth';
import {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
  VerificationToken
} from 'next-auth/adapters';
import sql from './db';

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
