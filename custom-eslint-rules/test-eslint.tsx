// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck - this file is for testing ESLint rules
/* eslint-disable no-unused-vars */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-empty-function */
/**
 * try removing the spaces between the comments and the code or removing the aria-label
 */

// Constants
const USER_ID = 1;
const USER_NAME = 'John';
const USER_EMAIL = 'john@example.com';
const API_URL = '/api';
const UserName = 'John';
const userData = () => {};
const updateUser = () => {};
const handleClick = () => {};
const validateUser = () => {};

const Link = ({ href }: { href: string }) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="External link"
    >
      Test Link
    </a>
  );
};

export default function TestComponent() {
  return (
    <div>
      <Link
        href="https://example.com"
        target="_blank"
        aria-label="External link"
        rel="noopener noreferrer"
      />
    </div>
  );
}
