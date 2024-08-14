import './Badge.css';

interface BadgeWrapperProps {
  badgeContent: React.ReactNode;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLElement>) => void;
}

export default function BadgeWrapper({
  badgeContent,
  children,
  onClick
}: BadgeWrapperProps) {
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    onClick?.(event);
  };
  return (
    <div className={`badge__container${onClick && ' cursor--pointer'}`}>
      {children}
      <span className="badge__content" onClick={handleClick}>
        {badgeContent}
      </span>
    </div>
  );
}
