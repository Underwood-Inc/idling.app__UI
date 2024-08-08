import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import reactStringReplace from 'react-string-replace';
import { CustomSession } from '../../../auth.config';
import { auth } from '../../../lib/auth';
import sql from '../../../lib/db';
import { tagRegex } from '../../../lib/utils/string/tag-regex';
import { Filter } from '../filter-bar/FilterBar';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import './SubmissionsList.css';

export default async function SubmissionsList({
  onlyMine = false,
  filters = []
}: {
  onlyMine?: boolean;
  filters: Filter<'tags'>[];
}) {
  noStore();

  const session = (await auth()) as CustomSession | null;

  const getSubmissions = async () => {
    let submissions: Submission[] = [];

    if (onlyMine && session?.user?.providerAccountId) {
      submissions = await sql`
        SELECT * FROM submissions
        WHERE author_id = ${session.user.providerAccountId}
        order by submission_datetime desc
      `;

      return submissions;
    } else if (!onlyMine) {
      // TODO: magic string 'tags'
      const tags = filters
        .find((filter) => filter.name === 'tags')
        ?.value.split(',')
        .map((value) => `#${value}`); // prepend a #. values come from URL so they are excluded lest the URL break expected params behavior

      // fake delay
      // await new Promise((resolve) => setTimeout(resolve, 7000));

      // select * where post contents contains any of the entries in the `tags` string array
      // @> is a "has both/all" match
      // && is a "contains any" match
      submissions = await sql`
        SELECT * FROM submissions
        ${tags ? sql`where tags && ${tags}` : sql``}
          order by submission_datetime desc
      `;

      return submissions;
    }

    return submissions;
  };

  const isAuthorized = (authorId: string) => {
    return session?.user?.providerAccountId === authorId;
  };

  const submissions = await getSubmissions();

  return (
    <ol className="submission__list">
      {!submissions.length && (
        <div className="empty">
          <p>
            No posts to show
            <br />
            ＞︿＜
          </p>
        </div>
      )}

      {!!submissions.length &&
        submissions.map(
          ({
            submission_id,
            submission_name,
            author,
            author_id,
            submission_datetime
          }) => {
            const canDelete = isAuthorized(author_id);
            const createdDate = new Date(
              submission_datetime
            ).toLocaleDateString();

            const fancyPost = reactStringReplace(
              submission_name,
              tagRegex,
              (match) => (
                <Link key={match} href={`/posts?tags=${match}`}>
                  #{match}
                </Link>
              )
            );

            return (
              <li key={submission_id} className="submission__wrapper">
                <p>
                  {author && (
                    <span className="submission__author">{author}:&nbsp;</span>
                  )}
                  <span>{fancyPost}</span>
                  <span className="submission__datetime">{createdDate}</span>
                </p>

                {canDelete && (
                  <DeleteSubmissionForm
                    id={submission_id}
                    name={submission_name}
                    isAuthorized={!!session}
                  />
                )}
              </li>
            );
          }
        )}
    </ol>
  );
}
