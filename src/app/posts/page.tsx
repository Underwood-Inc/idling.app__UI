import { auth } from "../../../auth";
import { AddSubmissionForm } from "../components/submission-forms/add-submission-form/AddSubmissionForm";
import SubmissionsList from "../components/submissions-list/SubmissionsList";
import rootStyles from "../page.module.css";

export default async function Posts() {
  const session = await auth();

  return (
    <main className={rootStyles.main}>
      <h4>POSTS</h4>

      <SubmissionsList />

      <AddSubmissionForm isAuthorized={!!session} />
    </main>
  );
}
