import { TSESLint, TSESTree } from '@typescript-eslint/utils';

interface RuleOptions {}

const defaultOptions: [RuleOptions] = [{}];

const rule: TSESLint.RuleModule<string, [RuleOptions]> = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Enforce target="_blank" and related security attributes on links'
    },
    fixable: 'code',
    schema: [],
    messages: {
      missingTarget: 'Links should have target="_blank"',
      missingRel:
        'Links with target="_blank" should have rel="noopener noreferrer"',
      missingAriaLabel: 'External links should have an aria-label',
      addMissingAttributes: 'Adding missing link attributes'
    }
  },
  defaultOptions,
  create(context) {
    return {
      JSXOpeningElement(node: TSESTree.JSXOpeningElement) {
        if (
          node.name.type !== 'JSXIdentifier' ||
          (node.name.name !== 'Link' && node.name.name !== 'a')
        ) {
          return;
        }

        const hasTarget = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.name === 'target' &&
            attr.value?.type === 'Literal' &&
            attr.value.value === '_blank'
        );

        const hasRel = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' &&
            attr.name.name === 'rel' &&
            attr.value?.type === 'Literal' &&
            attr.value.value === 'noopener noreferrer'
        );

        const hasAriaLabel = node.attributes.some(
          (attr) =>
            attr.type === 'JSXAttribute' && attr.name.name === 'aria-label'
        );

        // Report individual issues without fixes
        if (!hasTarget) {
          context.report({
            node,
            messageId: 'missingTarget'
          });
        }

        if (!hasRel) {
          context.report({
            node,
            messageId: 'missingRel'
          });
        }

        if (!hasAriaLabel) {
          context.report({
            node,
            messageId: 'missingAriaLabel'
          });
        }

        // Apply the fix if any attributes are missing
        const missingAttributes: string[] = [];
        if (!hasTarget) missingAttributes.push('target="_blank"');
        if (!hasRel) missingAttributes.push('rel="noopener noreferrer"');
        if (!hasAriaLabel) missingAttributes.push('aria-label="External link"');

        if (missingAttributes.length > 0) {
          const lastAttribute = node.attributes[node.attributes.length - 1];

          context.report({
            node,
            messageId: 'addMissingAttributes',
            fix(fixer) {
              const attributeText = ` ${missingAttributes.join(' ')}`;
              return fixer.insertTextAfter(
                lastAttribute || node.name,
                attributeText
              );
            }
          });
        }
      }
    };
  }
};

export default rule;
