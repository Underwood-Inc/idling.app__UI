import { unstable_noStore as noStore } from 'next/cache';
import { auth } from '../../../lib/auth';
import sql from '../../../lib/db';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import './SubmissionsList.css';

export default async function SubmissionsList({
  onlyMine = false
}: {
  onlyMine?: boolean;
}) {
  noStore();
  const session = await auth();

  const getSubmissions = async () => {
    let submissions: Submission[] = [];
    // await new Promise((resolve) => setTimeout(resolve, 7000));
    if (onlyMine && session?.user?.name) {
      submissions =
        await sql`SELECT * FROM submissions WHERE author = ${session.user.name} order by submission_datetime desc`;
      return submissions;
    } else if (!onlyMine) {
      submissions =
        await sql`SELECT * FROM submissions order by submission_datetime desc`;
      return submissions;
    }

    return submissions;
  };

  const isAuthorized = (author: string) => {
    return session?.user?.name === author;
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
          ({ submission_id, submission_name, author, submission_datetime }) => {
            const canDelete = isAuthorized(author);
            const createdDate = new Date(
              submission_datetime
            ).toLocaleDateString();

            return (
              <li key={submission_id} className="submission__wrapper">
                <p>
                  <span className="submission__author">{author}:&nbsp;</span>
                  <span>{submission_name}</span>
                </p>
                <span className="submission__datetime">{createdDate}</span>

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
