'use server';

import sql from '../../../lib/db';
import { parseZodErrors } from '../submission-forms/schema';
import { Tags, tagSchema } from './schema';

export async function getRecentTags(
  interval: 'months' | 'days' | 'hrs' = 'months',
  providerAccountId?: string
): Promise<{
  tags: string[];
  error: string;
  message: string;
}> {
  try {
    let subquerySql;

    // TODO: cleanup once casting issues figured out for INTERVAL (if possible)
    //
    // return records where:
    //   each row contains the following from the submissions table:
    //     - a new column named 'distinct_tags' which gets all unique tags from the tags string[] column
    //     - the submission_datetime for the accompanying unique tag found
    //   and the records matched are from the current datetimestamp up to the last n days/hrs/months (interval)
    //
    // NOTE: unnest is used to destructure the string[] tags into something query friendly
    // NOTE: due to the requirement of sorting based on datetime, the inclusion of submission_datetime will
    // return duplicate records as the query will be specifically returning distinct on BOTH tags & submission_datetime
    switch (interval) {
      case 'days':
        subquerySql = sql`
          select distinct unnest(tags) as distinct_tags, submission_datetime
          from submissions s
          where s.submission_datetime >= NOW() - INTERVAL '3 days'
          ${providerAccountId ? sql` and s.author_id = ${providerAccountId}` : sql``}
        `;
        break;
      case 'hrs':
        subquerySql = sql`
          select distinct unnest(tags) as distinct_tags, submission_datetime
          from submissions s
          where s.submission_datetime >= NOW() - INTERVAL '3 hrs'
          ${providerAccountId ? sql` and s.author_id = ${providerAccountId}` : sql``}
        `;
        break;
      case 'months':
        subquerySql = sql`
          select distinct unnest(tags) as distinct_tags, submission_datetime
          from submissions s
          where s.submission_datetime >= NOW() - INTERVAL '3 months'
          ${providerAccountId ? sql` and s.author_id = ${providerAccountId}` : sql``}
        `;
        break;
    }

    // using the above constructed query, in a new subquery, remove duplicate tags found by selecting all columns
    // where tags are unique from the above constructed query results
    // using a subquery this way, we can then do a final order by the corresponding submission_datetime for the unqieu tags found
    //
    // NOTE: further testing required to determine which records get removed during deduping as a result of distinct.
    //       - is it a FIFO situation?
    //       - are the records from the above constructed query in an particular order, does this impact results in this final
    //         awaited query?
    const result = await sql`
      select *
      from (
        select distinct on(subquery.distinct_tags) * from (${subquerySql}) as subquery
      ) as s
      order by s.submission_datetime desc
    `;

    // reduce the results from the postgresql query above into a string array
    if (result.length) {
      const tags = result.reduce((accumulator, current) => {
        accumulator.push(current.distinct_tags);

        return accumulator;
      }, [] as Tags);

      // safe parse using zod schema to prevent errors from being thrown so we can handle them in our own manner
      const { success, data, error } = tagSchema.safeParse(tags);

      if (success) {
        return { tags: data, error: '', message: '' };
      }

      return {
        tags: [],
        error: parseZodErrors(error),
        message: ''
      };
    }

    return {
      tags: [],
      error: '',
      message: ''
    };
  } catch (error) {
    console.error(error);

    return {
      tags: [],
      error: 'Something went wrong...',
      message: ''
    };
  }
}
