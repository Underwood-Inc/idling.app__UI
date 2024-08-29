module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Enforce target="_blank" for Next.js Link components with external href',
      category: 'Best Practices',
      recommended: true
    },
    fixable: 'code'
  },
  create(context) {
    return {
      JSXOpeningElement(node) {
        if (node.name.name === 'Link') {
          const targetAttribute = node.attributes.find(
            (attr) => attr.name.name === 'target'
          );
          const targetOK =
            targetAttribute && targetAttribute.value.value === '_blank';

          if (!targetOK) {
            context.report({
              node,
              message:
                'Next.js Link components must have target="_blank" if the href is external.',
              fix(fixer) {
                if (targetAttribute) {
                  return fixer.replaceText(targetAttribute.value, '"_blank"');
                }
                return fixer.insertTextAfter(node.name, ' target="_blank"');
              }
            });
          }
        }
      }
    };
  }
};
