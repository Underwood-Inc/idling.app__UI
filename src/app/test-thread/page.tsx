'use client';

import { useState } from 'react';
import Thread from '../components/thread/Thread';

export default function TestThreadPage() {
  const [submissionId, setSubmissionId] = useState<number>(1);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Thread Test Page</h1>
      <div style={{ marginBottom: '2rem' }}>
        <label>
          Submission ID to test:
          <input
            type="number"
            value={submissionId}
            onChange={(e) => setSubmissionId(Number(e.target.value))}
            style={{ marginLeft: '1rem', padding: '0.5rem' }}
          />
        </label>
      </div>

      <div style={{ border: '1px solid #ccc', padding: '1rem' }}>
        <Thread submissionId={submissionId} />
      </div>
    </div>
  );
}
