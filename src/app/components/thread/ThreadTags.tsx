'use client';

import { useSimpleUrlFilters } from '@lib/state/submissions/useSimpleUrlFilters';
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

  // Use the new URL-first filter system
  const { filters, addFilter, removeFilter } = useSimpleUrlFilters();

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
      } finally {
        setLoading(false);
      }
    };

    loadThreadTags();
  }, [submissionId]);

  const handleTagClick = (tag: string) => {
    // Ensure hashtag value includes # prefix for proper filtering
    const hashtagValue = tag.startsWith('#') ? tag : `#${tag}`;

    // Get current tag filters
    const currentTagFilters = filters.filter((f) => f.name === 'tags');
    const isTagActive = currentTagFilters.some((f) => {
      const filterValue = f.value.startsWith('#') ? f.value : `#${f.value}`;
      return filterValue === hashtagValue;
    });

    if (isTagActive) {
      // Remove the tag
      const tagToRemove = tag.startsWith('#') ? tag.slice(1) : tag;
      removeFilter('tags', tagToRemove);

      // If no more tag filters remain, remove tagLogic as well
      const remainingTagFilters = currentTagFilters.filter((f) => {
        const filterValue = f.value.startsWith('#')
          ? f.value.slice(1)
          : f.value;
        return filterValue !== tagToRemove;
      });

      if (remainingTagFilters.length <= 1) {
        removeFilter('tagLogic');
      }
    } else {
      // Add the tag
      const tagToAdd = tag.startsWith('#') ? tag.slice(1) : tag;
      addFilter({ name: 'tags', value: tagToAdd });

      // Add tagLogic if we'll have multiple tags
      if (currentTagFilters.length >= 1) {
        addFilter({ name: 'tagLogic', value: 'OR' });
      }
    }
  };

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
            onTagClick={handleTagClick}
          />
        ))}
      </div>
    </div>
  );
}
