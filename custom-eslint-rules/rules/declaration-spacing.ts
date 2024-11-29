import { TSESLint, TSESTree } from '@typescript-eslint/utils';

interface RuleOptions {
  minLines?: number;
  groups?: string[];
}

const defaultOptions: [RuleOptions] = [
  {
    minLines: 1,
    groups: ['[A-Z][A-Z_]+', 'handle[A-Z]\\w+']
  }
];

const rule: TSESLint.RuleModule<'missingSeparation', [RuleOptions]> = {
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
      missingSeparation:
        'Different declaration groups should be separated by empty lines'
    }
  },
  defaultOptions,
  create(context) {
    const options = { ...defaultOptions[0], ...context.options[0] };

    const getDeclarationName = (node: TSESTree.Node): string => {
      if (node.type === 'VariableDeclaration') {
        const decl = node.declarations[0];
        return decl?.id?.type === 'Identifier' ? decl.id.name : '';
      }
      if (node.type === 'FunctionDeclaration') {
        return node.id?.name || '';
      }
      if (node.type === 'ExportDefaultDeclaration') {
        const decl = node.declaration;
        if (decl.type === 'FunctionDeclaration') {
          return decl.id?.name || 'default';
        }
        return 'default';
      }
      return '';
    };

    const shouldCheckSpacing = (curr: TSESTree.Node, prev: TSESTree.Node) => {
      const currName = getDeclarationName(curr);
      const prevName = getDeclarationName(prev);

      if (!currName && !prevName) return false;

      const currGroup = options.groups?.find((pattern) =>
        new RegExp(pattern).test(currName)
      );
      const prevGroup = options.groups?.find((pattern) =>
        new RegExp(pattern).test(prevName)
      );

      return currGroup !== prevGroup && (currGroup || prevGroup);
    };

    return {
      Program(node: TSESTree.Program) {
        node.body.forEach((stmt, index) => {
          if (index === 0) return;

          const currentStmt = stmt;
          const prevStmt = node.body[index - 1];

          if (shouldCheckSpacing(currentStmt, prevStmt)) {
            const linesBetween =
              currentStmt.loc!.start.line - prevStmt.loc!.end.line - 1;
            if (linesBetween < (options.minLines ?? 1)) {
              context.report({
                node: currentStmt,
                messageId: 'missingSeparation',
                fix(fixer) {
                  return fixer.insertTextBefore(
                    currentStmt,
                    '\n'.repeat((options.minLines ?? 1) - linesBetween)
                  );
                }
              });
            }
          }
        });
      }
    };
  }
};

export default rule;
