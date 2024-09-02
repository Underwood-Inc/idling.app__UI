import { BADGE_SELECTORS } from 'src/lib/test-selectors/components/badge';
import './Badge.css';

interface BadgeWrapperProps {
  badgeContent: React.ReactNode;
  children: React.ReactNode;
  // eslint-disable-next-line no-unused-vars
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
  showOnHover: boolean;
}

export default function BadgeWrapper({
  badgeContent,
  children,
  onClick,
  showOnHover = false
}: BadgeWrapperProps) {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onClick?.(event);
  };
  const className = showOnHover ? '--hover' : '';

  return (
    <div
      className={`badge__container${className}`}
      data-testid={BADGE_SELECTORS.CONTAINER}
    >
      {children}
      <span
        className={`badge__content ${onClick && ' cursor--pointer'}`}
        onClick={handleClick}
        data-testid={BADGE_SELECTORS.CONTENT}
      >
        {badgeContent}
      </span>
    </div>
  );
}
