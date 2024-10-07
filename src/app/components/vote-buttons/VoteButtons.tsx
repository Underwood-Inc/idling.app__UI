'use client';
import { useState } from 'react';
import { voteComment } from 'src/lib/actions/comment.actions';
import { votePost } from 'src/lib/actions/post.actions';

interface VoteButtonsProps {
  score: number;
  id: string;
  type: 'post' | 'comment';
}

export default function VoteButtons({ score, id, type }: VoteButtonsProps) {
  const [currentScore, setCurrentScore] = useState(score);

  const handleVote = async (voteType: 1 | -1) => {
    try {
      if (type === 'post') {
        await votePost(id, voteType);
      } else {
        await voteComment(id, voteType);
      }
      setCurrentScore((prevScore) => prevScore + voteType);
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => handleVote(1)}
        className="text-gray-500 hover:text-red-500"
      >
        ▲
      </button>
      <span className="text-sm font-semibold">{currentScore}</span>
      <button
        onClick={() => handleVote(-1)}
        className="text-gray-500 hover:text-blue-500"
      >
        ▼
      </button>
    </div>
  );
}
