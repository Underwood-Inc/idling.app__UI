import { unstable_noStore as noStore } from 'next/cache';
import { auth } from '../../../../auth';
import sql from '../../../lib/db';
import { DeleteSubmissionForm } from '../submission-forms/delete-submission-form/DeleteSubmissionForm';
import { Submission } from '../submission-forms/schema';
import './SubmissionsList.css';

export default async function SubmissionsList() {
  noStore();
  const getSubmissions = async () => {
    // await new Promise((resolve) => setTimeout(resolve, 7000));
    const submissions: Submission[] =
      await sql`SELECT * FROM submissions order by submission_datetime desc`;
    return submissions;
  };
  const submissions = await getSubmissions();
  const session = await auth();
  const isAuthorized = (author: string) => {
    return session?.user?.name === author;
  };

  return (
    <ol className="submission__list">
      {submissions.map(
        ({ submission_id, submission_name, author, submission_datetime }) => {
          const canDelete = isAuthorized(author);
          const createdDate = new Date(
            submission_datetime
          ).toLocaleDateString();

          return (
            <li key={submission_id} className="submission__wrapper">
              <p className="submission__author">
                <span>{author}:&nbsp;</span>
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
