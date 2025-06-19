'use client';

import { useEffect, useState } from 'react';
import { TagLink } from '../tag-link/TagLink';
import { getSubmissionThread } from './actions';
import './ThreadTags.css';

interface ThreadTagsProps {
  submissionId: number;
  contextId: string;
}

export default function ThreadTags({
  submissionId,
  contextId
}: ThreadTagsProps) {
  const [threadTags, setThreadTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadThreadTags = async () => {
      try {
        setLoading(true);
        const threadData = await getSubmissionThread(submissionId);

        // Collect all tags from parent and replies
        const allTags = new Set<string>();

        // Add parent tags
        if (threadData.parent?.tags) {
          threadData.parent.tags.forEach((tag) => allTags.add(tag));
        }

        // Add reply tags
        threadData.replies.forEach((reply) => {
          if (reply.tags) {
            reply.tags.forEach((tag) => allTags.add(tag));
          }
        });

        setThreadTags(Array.from(allTags).sort());
      } catch (error) {
        console.error('Error loading thread tags:', error);
        setThreadTags([]);
      } finally {
        setLoading(false);
      }
    };

    loadThreadTags();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="thread-tags">
        <h3 className="thread-tags__title">Thread Tags</h3>
        <div className="thread-tags__loading">Loading tags...</div>
      </div>
    );
  }

  if (threadTags.length === 0) {
    return (
      <div className="thread-tags">
        <h3 className="thread-tags__title">Thread Tags</h3>
        <p className="thread-tags__empty">No tags in this thread</p>
      </div>
    );
  }

  return (
    <div className="thread-tags">
      <h3 className="thread-tags__title">Thread Tags ({threadTags.length})</h3>
      <div className="thread-tags__list">
        {threadTags.map((tag) => (
          <TagLink
            key={tag}
            value={tag}
            contextId={contextId}
            appendSearchParam={false}
          />
        ))}
      </div>
    </div>
  );
}
