import sql from "../../../lib/db";
import { DeleteSubmissionForm } from "../submission-forms/delete-submission-form/DeleteSubmissionForm";
import "./SubmissionsList.css";

interface Submission {
  submission_id: number;
  submission_name: string;
  submission_datetime: string;
}

export default async function SubmissionsList() {
  const submissions: Submission[] = await sql`SELECT * FROM submissions`;

  return (
    <ol className="submission_list">
      {submissions.map(({ submission_id, submission_name }) => (
        <li key={submission_id} className="submission_wrapper">
          <span>{submission_name}</span>
          <DeleteSubmissionForm id={submission_id} name={submission_name} />
        </li>
      ))}
    </ol>
  );
}
