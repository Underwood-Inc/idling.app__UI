'use client';

import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { getSubmissionsFiltersAtom } from '../../../lib/state/atoms';
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

  // Access the filter state for this context
  const [filtersState, setFiltersState] = useAtom(
    getSubmissionsFiltersAtom(contextId)
  );

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

  const handleTagClick = (tag: string) => {
    // Ensure hashtag value includes # prefix for proper filtering
    const hashtagValue = tag.startsWith('#') ? tag : `#${tag}`;

    setFiltersState((prev) => {
      const newFilters = [...prev.filters];
      const tagsIndex = newFilters.findIndex((f) => f.name === 'tags');

      if (tagsIndex >= 0) {
        // Update existing tags filter
        const currentTags = newFilters[tagsIndex].value
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean);

        const isTagActive = currentTags.includes(hashtagValue);
        const updatedTags = isTagActive
          ? currentTags.filter((tag) => tag !== hashtagValue)
          : [...currentTags, hashtagValue];

        if (updatedTags.length > 0) {
          newFilters[tagsIndex] = {
            name: 'tags',
            value: updatedTags.join(',')
          };
        } else {
          // Remove tags filter if no tags left
          return {
            ...prev,
            filters: newFilters.filter(
              (f) => f.name !== 'tags' && f.name !== 'tagLogic'
            )
          };
        }
      } else {
        // Add new tags filter
        newFilters.push({ name: 'tags', value: hashtagValue });
      }

      return {
        ...prev,
        filters: newFilters,
        page: 1
      };
    });
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
