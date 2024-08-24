const { faker } = require('@faker-js/faker');
const postgres = require('postgres');

const SEED_RECORD_COUNT = 500;

const sql = postgres({
  host: process.env.IS_DOCKERIZED ? 'postgres' : process.env.POSTGRES_HOST,
  user: process.env.IS_DOCKERIZED ? 'postgres' : process.env.POSTGRES_USER,
  database: process.env.IS_DOCKERIZED ? 'idling' : process.env.POSTGRES_DB,
  pass: process.env.IS_DOCKERIZED ? 'postgres' : process.env.POSTGRES_PASSWORD,
  port: process.env.IS_DOCKERIZED ? 5432 : process.env.PSOTGRES_PORT,
  ssl: 'prefer'
});

const generateRandomSentenceWithTags = (tags) => {
  let sentence = faker.lorem.sentence();
  tags.forEach((tag) => {
    const words = sentence.split(' ');
    const randomIndex = faker.number.int({
      min: 0,
      max: words.length - 1
    });
    words.splice(randomIndex, 0, tag);
    sentence = words.join(' ');
  });
  return sentence;
};

const generateRecords = async () => {
  try {
    for (let i = 0; i < SEED_RECORD_COUNT; i++) {
      // Generate user
      const name = faker.person.fullName();
      const email = faker.internet.email();
      const emailVerified = faker.date.past();
      const image = faker.image.avatar();

      const userResult = await sql`
        INSERT INTO users (name, email, "emailVerified", image)
        VALUES (${name}, ${email}, ${emailVerified}, ${image})
        RETURNING id
      `;
      const userId = userResult[0].id;

      // Generate account
      const type = faker.lorem.word();
      const provider = faker.internet.domainName();
      const providerAccountId = faker.string.uuid();
      const refresh_token = faker.internet.password();
      const access_token = faker.internet.password();
      const expires_at = faker.number.int({
        min: 1609459200,
        max: 1672444800
      }); // Random timestamp
      const id_token = faker.internet.password();
      const scope = faker.lorem.word();
      const session_state = faker.lorem.word();
      const token_type = faker.lorem.word();

      await sql`
        INSERT INTO accounts (
          "userId",
          type,
          provider,
          "providerAccountId",
          refresh_token,
          access_token,
          expires_at,
          id_token,
          scope,
          session_state,
          token_type
        ) VALUES (
          ${userId},
          ${type},
          ${provider},
          ${providerAccountId},
          ${refresh_token},
          ${access_token},
          ${expires_at},
          ${id_token},
          ${scope},
          ${session_state},
          ${token_type}
        )
      `;

      // Generate submission
      const useTags = faker.datatype.boolean();
      let submission_name;
      let tags = [];

      if (useTags) {
        tags = Array.from({ length: 5 }, () => `#${faker.lorem.word()}`);
        submission_name = generateRandomSentenceWithTags(tags);
      } else {
        submission_name = faker.lorem.sentence();
      }

      const author = name;

      await sql`
        INSERT INTO submissions (submission_name, author_id, author, tags)
        VALUES (${submission_name}, ${userId}, ${author}, ${tags})
      `;
    }

    console.info('Records generated successfully');
  } catch (error) {
    console.error('Error generating records:', error);
  } finally {
    await sql.end();
  }
};

generateRecords();
