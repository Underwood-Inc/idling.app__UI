'use client';

interface HamburgerMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  ariaLabel?: string;
  className?: string;
}

export function HamburgerMenuButton({
  isOpen,
  onClick,
  ariaLabel = 'Toggle mobile menu',
  className = ''
}: HamburgerMenuButtonProps) {
  return (
    <button
      className={`hamburger-menu-button ${isOpen ? 'hamburger-menu-button--open' : ''} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={isOpen}
      type="button"
    >
      <span className="hamburger-menu-button__lines">
        <span className="hamburger-menu-button__line"></span>
        <span className="hamburger-menu-button__line"></span>
        <span className="hamburger-menu-button__line"></span>
      </span>
    </button>
  );
}
