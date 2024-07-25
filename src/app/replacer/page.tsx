import sql from "../../lib/db";
import { AddSubmissionForm } from "../components/submission-forms/add-submission-form/AddSubmissionForm";
import { DeleteSubmissionForm } from "../components/submission-forms/delete-submission-form/DeleteSubmissionForm";
import rootStyles from "../page.module.css";
import styles from "./page.module.css";

interface Submission {
  submission_id: number;
  submission_name: string;
  submission_datetime: string;
}

export default async function Replacer() {
  const submissions: Submission[] = await sql`SELECT * FROM submissions`;
  console.log("submissions", submissions);

  return (
    <main className={rootStyles.main}>
      <h3>submissions</h3>

      <div className={rootStyles.content}>
        <ol>
          {submissions.map(({ submission_id, submission_name }) => (
            <li key={submission_id}>
              <div className={styles.submission}>
                <span>{submission_name}</span>
                <DeleteSubmissionForm
                  id={submission_id}
                  name={submission_name}
                />
              </div>
            </li>
          ))}
        </ol>
      </div>

      <AddSubmissionForm />
    </main>
  );
}
