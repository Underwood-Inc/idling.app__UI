import './Badge.css';

interface BadgeWrapperProps {
  badgeContent: React.ReactNode;
  children: React.ReactNode;
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
      className={`badge__container${className}${onClick && ' cursor--pointer'}`}
    >
      {children}
      <span className={`badge__content`} onClick={handleClick}>
        {badgeContent}
      </span>
    </div>
  );
}