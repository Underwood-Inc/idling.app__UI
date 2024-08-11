'use server';

import sql from '../../../lib/db';
import fakeDelay from '../../../lib/utils/fake-delay';
import { parseZodErrors } from '../submission-forms/schema';
import { Tags, tagSchema } from './schema';

export async function getRecentTags(
  interval: 'months' | 'days' | 'hrs' = 'months'
): Promise<{
  tags: string[];
  error: string;
  message: string;
}> {
  try {
    await fakeDelay();
    let subquerySql;

    // cleanup once casting issues figured out for INTERVAL (if possible)
    switch (interval) {
      case 'days':
        subquerySql = sql`
          select distinct unnest(tags) as distinct_tags, submission_datetime
          from submissions s
          where s.submission_datetime >= NOW() - INTERVAL '3 days'
        `;
        break;
      case 'hrs':
        subquerySql = sql`
          select distinct unnest(tags) as distinct_tags, submission_datetime
          from submissions s
          where s.submission_datetime >= NOW() - INTERVAL '3 hrs'
        `;
        break;
      case 'months':
        subquerySql = sql`
          select distinct unnest(tags) as distinct_tags, submission_datetime
          from submissions s
          where s.submission_datetime >= NOW() - INTERVAL '3 months'
        `;
        break;
    }

    const result = await sql`
      select *
      from (
        select distinct on(subquery.distinct_tags) * from (${subquerySql}) as subquery
      ) as s
      order by s.submission_datetime desc
    `;

    if (result.length) {
      const tags = result.reduce((accumulator, current) => {
        accumulator.push(current.distinct_tags);

        return accumulator;
      }, [] as Tags);

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
