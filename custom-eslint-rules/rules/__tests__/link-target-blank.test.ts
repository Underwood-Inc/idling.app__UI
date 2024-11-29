import { TSESLint } from '@typescript-eslint/utils';
import rule from '../link-target-blank';

const ruleTester = new TSESLint.RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  }
});

const normalizeWhitespace = (code: string) =>
  code
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/{\s+/g, '{')
    .replace(/\s+}/g, '}')
    .trim();

ruleTester.run('link-target-blank', rule, {
  valid: [
    {
      code: normalizeWhitespace(`
        const Link = ({ href }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="External link"
          >
            Test Link
          </a>
        );`)
    },
    {
      code: normalizeWhitespace(`
        export default function TestComponent() {
          return (
            <Link
              href="https://example.com"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="External link"
            />
          );
        }`)
    }
  ],
  invalid: [
    {
      code: normalizeWhitespace(`
        const Link = ({ href }) => (
          <a href={href}>Test Link</a>
        );`),
      errors: [
        { messageId: 'missingTarget' },
        { messageId: 'missingRel' },
        { messageId: 'missingAriaLabel' },
        { messageId: 'addMissingAttributes' }
      ],
      output: normalizeWhitespace(`
        const Link = ({ href }) => (
          <a href={href} target="_blank" rel="noopener noreferrer" aria-label="External link">Test Link</a>
        );`)
    },
    {
      code: normalizeWhitespace(`
        export default function TestComponent() {
          return (
            <Link
              href="https://example.com"
            />
          );
        }`),
      errors: [
        { messageId: 'missingTarget' },
        { messageId: 'missingRel' },
        { messageId: 'missingAriaLabel' },
        { messageId: 'addMissingAttributes' }
      ],
      output: normalizeWhitespace(`
        export default function TestComponent() {
          return (
            <Link href="https://example.com" target="_blank" rel="noopener noreferrer" aria-label="External link" />
          );
        }`)
    }
  ]
});
