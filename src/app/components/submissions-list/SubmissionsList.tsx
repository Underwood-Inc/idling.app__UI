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
    const submissions: Submission[] = await sql`SELECT * FROM submissions`;
    return submissions;
  };
  const submissions = await getSubmissions();
  const isAuthorized = !!(await auth());

  return (
    <ol className="submission_list">
      {submissions.map(({ submission_id, submission_name }) => (
        <li key={submission_id} className="submission_wrapper">
          <p>{submission_name}</p>
          <DeleteSubmissionForm
            id={submission_id}
            name={submission_name}
            isAuthorized={isAuthorized}
          />
        </li>
      ))}
    </ol>
  );
}
