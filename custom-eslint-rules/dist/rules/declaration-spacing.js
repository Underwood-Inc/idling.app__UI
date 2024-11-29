"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const defaultOptions = [
    {
        minLines: 1,
        groups: ['[A-Z][A-Z_]+', 'handle[A-Z]\\w+']
    }
];
const rule = {
    meta: {
        type: 'layout',
        docs: {
            description: 'Enforce spacing between different groups of declarations'
        },
        fixable: 'whitespace',
        schema: [
            {
                type: 'object',
                properties: {
                    minLines: { type: 'number' },
                    groups: {
                        type: 'array',
                        items: { type: 'string' }
                    }
                },
                additionalProperties: false
            }
        ],
        messages: {
            missingSeparation: 'Different declaration groups should be separated by empty lines'
        }
    },
    defaultOptions,
    create(context) {
        const options = { ...defaultOptions[0], ...context.options[0] };
        const getDeclarationName = (node) => {
            var _a, _b, _c;
            if (node.type === 'VariableDeclaration') {
                const decl = node.declarations[0];
                return ((_a = decl === null || decl === void 0 ? void 0 : decl.id) === null || _a === void 0 ? void 0 : _a.type) === 'Identifier' ? decl.id.name : '';
            }
            if (node.type === 'FunctionDeclaration') {
                return ((_b = node.id) === null || _b === void 0 ? void 0 : _b.name) || '';
            }
            if (node.type === 'ExportDefaultDeclaration') {
                const decl = node.declaration;
                if (decl.type === 'FunctionDeclaration') {
                    return ((_c = decl.id) === null || _c === void 0 ? void 0 : _c.name) || 'default';
                }
                return 'default';
            }
            return '';
        };
        const shouldCheckSpacing = (curr, prev) => {
            var _a, _b;
            const currName = getDeclarationName(curr);
            const prevName = getDeclarationName(prev);
            if (!currName && !prevName)
                return false;
            const currGroup = (_a = options.groups) === null || _a === void 0 ? void 0 : _a.find((pattern) => new RegExp(pattern).test(currName));
            const prevGroup = (_b = options.groups) === null || _b === void 0 ? void 0 : _b.find((pattern) => new RegExp(pattern).test(prevName));
            return currGroup !== prevGroup && (currGroup || prevGroup);
        };
        return {
            Program(node) {
                node.body.forEach((stmt, index) => {
                    var _a;
                    if (index === 0)
                        return;
                    const currentStmt = stmt;
                    const prevStmt = node.body[index - 1];
                    if (shouldCheckSpacing(currentStmt, prevStmt)) {
                        const linesBetween = currentStmt.loc.start.line - prevStmt.loc.end.line - 1;
                        if (linesBetween < ((_a = options.minLines) !== null && _a !== void 0 ? _a : 1)) {
                            context.report({
                                node: currentStmt,
                                messageId: 'missingSeparation',
                                fix(fixer) {
                                    var _a;
                                    return fixer.insertTextBefore(currentStmt, '\n'.repeat(((_a = options.minLines) !== null && _a !== void 0 ? _a : 1) - linesBetween));
                                }
                            });
                        }
                    }
                });
            }
        };
    }
};
exports.default = rule;
//# sourceMappingURL=declaration-spacing.js.map