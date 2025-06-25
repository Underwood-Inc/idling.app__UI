import { useEffect, useRef } from 'react';
import './MentionTooltip.css';

interface MentionTooltipProps {
  username: string;
  onFilterByAuthor: () => void;
  onFilterByContent: () => void;
  onClose: () => void;
  onHover?: () => void;
  onLeave?: () => void;
  position: { x: number; y: number };
}

export function MentionTooltip({
  username,
  onFilterByAuthor,
  onFilterByContent,
  onClose,
  onHover,
  onLeave,
  position
}: MentionTooltipProps) {
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  return (
    <div
      ref={tooltipRef}
      className="mention-tooltip"
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        zIndex: 10000,
        display: 'block'
      }}
    >
      <div className="mention-tooltip__header">Filter by @{username}</div>
      <div className="mention-tooltip__options">
        <button
          className="mention-tooltip__option mention-tooltip__option--primary"
          onClick={onFilterByAuthor}
          title="Show posts authored by this user"
        >
          <span className="mention-tooltip__icon">👤</span>
          Filter by Author
          <span className="mention-tooltip__description">
            Posts by this user
          </span>
        </button>
        <button
          className="mention-tooltip__option"
          onClick={onFilterByContent}
          title="Show posts that mention this user"
        >
          <span className="mention-tooltip__icon">💬</span>
          Filter by Mentions
          <span className="mention-tooltip__description">
            Posts mentioning this user
          </span>
        </button>
      </div>
    </div>
  );
}
