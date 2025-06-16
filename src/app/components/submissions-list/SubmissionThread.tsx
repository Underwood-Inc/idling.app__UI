'use client';

import { Submission } from '../submission-forms/schema';
import { ReplyForm } from '../thread/ReplyForm';
import './SubmissionThread.css';

interface SubmissionWithReplies extends Submission {
  replies?: SubmissionWithReplies[];
}

interface SubmissionThreadProps {
  submission: SubmissionWithReplies;
  isAuthorized: boolean;
  activeReplies: { [key: number]: boolean };
  setActiveReplies: (replies: { [key: number]: boolean }) => void;
  expandedThreads: { [key: number]: boolean };
  setExpandedThreads: (threads: { [key: number]: boolean }) => void;
  onTagClick: (tag: string) => void;
}

export function SubmissionThread({
  submission,
  isAuthorized,
  activeReplies,
  setActiveReplies,
  expandedThreads,
  setExpandedThreads,
  onTagClick
}: SubmissionThreadProps) {
  const toggleReply = () => {
    setActiveReplies({
      ...activeReplies,
      [submission.submission_id]: !activeReplies[submission.submission_id]
    });
  };

  const toggleExpand = () => {
    setExpandedThreads({
      ...expandedThreads,
      [submission.submission_id]: !expandedThreads[submission.submission_id]
    });
  };

  return (
    <div className="submission-thread">
      <div className="submission-thread__header">
        <div className="submission-thread__content">
          <h3 className="submission-thread__title">
            {submission.submission_name}
          </h3>
          <p className="submission-thread__datetime">
            {new Date(submission.submission_datetime).toLocaleString()}
          </p>
          {submission.tags && submission.tags.length > 0 && (
            <div className="submission-thread__tags">
              {submission.tags.map((tag) => (
                <span
                  key={tag}
                  className="submission-thread__tag"
                  onClick={() => onTagClick(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="submission-thread__actions">
          {isAuthorized && (
            <button
              onClick={toggleReply}
              className="submission-thread__reply-button"
            >
              {activeReplies[submission.submission_id] ? 'Cancel' : 'Reply'}
            </button>
          )}
          {submission.replies && submission.replies.length > 0 && (
            <button
              onClick={toggleExpand}
              className="submission-thread__expand-button"
            >
              {expandedThreads[submission.submission_id]
                ? 'Collapse'
                : 'Expand'}
            </button>
          )}
        </div>
      </div>

      {activeReplies[submission.submission_id] && (
        <div className="submission-thread__reply-form">
          <ReplyForm parentId={submission.submission_id} />
        </div>
      )}

      {expandedThreads[submission.submission_id] &&
        submission.replies &&
        submission.replies.length > 0 && (
          <div className="submission-thread__replies">
            {submission.replies.map((reply) => (
              <SubmissionThread
                key={reply.submission_id}
                submission={reply}
                isAuthorized={isAuthorized}
                activeReplies={activeReplies}
                setActiveReplies={setActiveReplies}
                expandedThreads={expandedThreads}
                setExpandedThreads={setExpandedThreads}
                onTagClick={onTagClick}
              />
            ))}
          </div>
        )}
    </div>
  );
}
