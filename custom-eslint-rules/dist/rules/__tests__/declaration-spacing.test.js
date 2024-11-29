"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("@typescript-eslint/utils");
const declaration_spacing_1 = __importDefault(require("../declaration-spacing"));
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
ruleTester.run('declaration-spacing', declaration_spacing_1.default, {
    valid: [
        {
            code: `
// Constants
const USER_ID = 1;
const USER_NAME = 'John';
const USER_EMAIL = 'john@example.com';

// Event handlers
const handleClick = () => {};
const handleSubmit = () => {};

// Data operations
const updateUser = () => {};
const validateUser = () => {};

const Link = ({ href }) => {
  return <a href={href}>Test Link</a>;
};

export default function TestComponent() {
  return <div />;
}`
        },
        {
            code: `
const USER_ID = 1;
const USER_NAME = 'John';

const firstName = 'John';
const lastName = 'Doe';

const handleClick = () => {};
const handleSubmit = () => {};`,
            options: [{ minLines: 1, groups: ['[A-Z][A-Z_]+', 'handle[A-Z]\\w+'] }]
        }
    ],
    invalid: [
        {
            code: `
const USER_ID = 1;
const handleClick = () => {};
const USER_NAME = 'John';`,
            errors: [
                { messageId: 'missingSeparation' },
                { messageId: 'missingSeparation' }
            ],
            output: `
const USER_ID = 1;

const handleClick = () => {};

const USER_NAME = 'John';`
        },
        {
            code: `
const USER_ID = 1;
export default function Test() {}`,
            errors: [{ messageId: 'missingSeparation' }],
            output: `
const USER_ID = 1;

export default function Test() {}`
        },
        {
            code: `
const handleClick = () => {};
const USER_ID = 1;`,
            errors: [{ messageId: 'missingSeparation' }],
            output: `
const handleClick = () => {};

const USER_ID = 1;`
        },
        {
            code: `
const firstName = 'John';
const handleClick = () => {};`,
            options: [{ minLines: 1, groups: ['handle[A-Z]\\w+'] }],
            errors: [{ messageId: 'missingSeparation' }],
            output: `
const firstName = 'John';

const handleClick = () => {};`
        }
    ]
});
//# sourceMappingURL=declaration-spacing.test.js.map