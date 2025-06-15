'use client';
import { useState } from 'react';
import { voteComment } from 'src/lib/actions/comment.actions';
import { votePost } from 'src/lib/actions/post.actions';
import './VoteButtons.css';

interface VoteButtonsProps {
  score: number;
  id: string;
  type: 'post' | 'comment';
}

export default function VoteButtons({ score, id, type }: VoteButtonsProps) {
  const [currentScore, setCurrentScore] = useState(score);
  const [isVoting, setIsVoting] = useState(false);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [hasDownvoted, setHasDownvoted] = useState(false);

  const handleVote = async (voteType: 1 | -1) => {
    try {
      setIsVoting(true);
      if (type === 'post') {
        await votePost(id, voteType);
      } else {
        await voteComment(id, voteType);
      }
      setCurrentScore((prevScore) => prevScore + voteType);
      if (voteType === 1) {
        setHasUpvoted(true);
        setHasDownvoted(false);
      } else {
        setHasUpvoted(false);
        setHasDownvoted(true);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="vote-buttons">
      <div className="vote-buttons__container">
        <button
          onClick={() => handleVote(1)}
          disabled={isVoting}
          className={`vote-buttons__button vote-buttons__button--up ${hasUpvoted ? 'vote-buttons__button--active' : ''}`}
          aria-label="Upvote"
        >
          ▲
        </button>
        <span className="vote-buttons__score">{currentScore}</span>
        <button
          onClick={() => handleVote(-1)}
          disabled={isVoting}
          className={`vote-buttons__button vote-buttons__button--down ${hasDownvoted ? 'vote-buttons__button--active' : ''}`}
          aria-label="Downvote"
        >
          ▼
        </button>
      </div>
    </div>
  );
}
