import { AddSubmissionForm } from "../components/submission-forms/add-submission-form/AddSubmissionForm";
import SubmissionsList from "../components/submissions-list/SubmissionsList";
import rootStyles from "../page.module.css";

export default async function Replacer() {
  return (
    <main className={rootStyles.main}>
      <h3>submissions</h3>

      <SubmissionsList />

      <AddSubmissionForm />
    </main>
  );
}
