import React from 'react';

export function NavbarItem({
  children,
  className = '',
  isDisabled = false
}: {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
}) {
  return (
    <div className={`navbar__item ${className}`} aria-disabled={isDisabled}>
      {children}
    </div>
  );
}
