"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const link_target_blank_1 = __importDefault(require("../link-target-blank"));
const ruleTester = new utils_1.TSESLint.RuleTester({
    parser: require.resolve('@typescript-eslint/parser'),
    parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
            jsx: true
        }
    }
});
const normalizeWhitespace = (code) => code
    .replace(/\s+/g, ' ')
    .replace(/>\s+</g, '><')
    .replace(/\s+>/g, '>')
    .replace(/{\s+/g, '{')
    .replace(/\s+}/g, '}')
    .trim();
ruleTester.run('link-target-blank', link_target_blank_1.default, {
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
//# sourceMappingURL=link-target-blank.test.js.map