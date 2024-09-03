import React from 'react';
import { NAV_PATHS_SELECTORS } from 'src/lib/test-selectors/components/nav-paths.selectors';

export function NavbarItem({
  children,
  className = '',
  isDisabled = false,
  testId = NAV_PATHS_SELECTORS.ITEM
}: {
  children: React.ReactNode;
  className?: string;
  isDisabled?: boolean;
  testId?: string;
}) {
  return (
    <div
      className={`navbar__item ${className}`}
      aria-disabled={isDisabled}
      data-testid={testId}
    >
      {children}
    </div>
  );
}
