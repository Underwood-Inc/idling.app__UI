const linkTargetBlank = require('./dist/rules/link-target-blank');
const declarationSpacing = require('./dist/rules/declaration-spacing');

module.exports = {
  rules: {
    'link-target-blank': linkTargetBlank,
    'declaration-spacing': declarationSpacing
  }
};
