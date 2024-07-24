import { FormEvent } from "react";
import sql from "../../lib/db";
import { AddSubmissionForm } from "../components/add-submission-form/AddSubmissionForm";
import styles from "../page.module.css";

export default async function Replacer() {
  let submissions = await sql`SELECT * FROM submissions`;
  console.log('submissions', submissions)
  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    debugger
    console.log('event', event);

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    });
    // Handle the response as needed
    const data = await response.json();
    // ...
  }

  return (
    <main className={styles.main}>
      <h2>TEST</h2>

      <AddSubmissionForm />
    </main>
  );
}
