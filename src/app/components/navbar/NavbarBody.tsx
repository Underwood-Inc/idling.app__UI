'use client';

export function NavbarBody({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={`navbar__body ${className}`}>{children}</div>;
}
