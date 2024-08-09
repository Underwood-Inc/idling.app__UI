'use server';

import sql from '../../../lib/db';
import { parseZodErrors } from '../submission-forms/schema';
import { Tags, tagSchema } from './schema';

export async function getRecentTags(): Promise<{
  tags: string[];
  error: string;
  message: string;
}> {
  try {
    const result = await sql`
      select distinct unnest(tags) as distinct_tags
      from submissions s
      where s.submission_datetime >= NOW() - INTERVAL '3 months';
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
