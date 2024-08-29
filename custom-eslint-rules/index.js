const linkTargetBlankRule = require('./rules/link-target-blank');

const plugin = {
  rules: { 'enforce-link-target-blank': linkTargetBlankRule }
};

module.exports = plugin;
