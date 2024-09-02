const prettier = require('prettier');
const path = require('path');

const types = [
  'feat',
  'fix',
  'docs',
  'chore',
  'style',
  'refactor',
  'perf',
  'test'
];

module.exports = {
  parserOpts: {
    headerPattern: /^(\w*)(?:\((.*)\))?: (.*)$/,
    headerCorrespondence: ['type', 'scope', 'subject']
  },
  writerOpts: {
    transform: (commit, context) => {
      // Include all commit types for now
      // if (!types.includes(commit.type)) {
      //   log(`Skipping commit with type: ${commit.type}`);
      //   return false;
      // }

      const typeMap = {
        feat: 'Features',
        fix: 'Bug Fixes',
        docs: 'Documentation',
        chore: 'Chores',
        style: 'Styles',
        refactor: 'Refactors',
        perf: 'Performance Improvements',
        test: 'Tests'
      };

      commit.type = typeMap[commit.type] || commit.type;

      return commit;
    },
    groupBy: 'type',
    commitGroupsSort: 'title',
    commitsSort: ['scope', 'subject'],
    noteGroupsSort: 'title',
    mainTemplate:
      // eslint-disable-next-line max-len
      '{{> header}}{{#each commitGroups}}{{#if title}}### {{title}}\n{{/if}}{{#each commits}}{{> commit root=@root}}{{/each}}{{/each}}{{> footer}}',
    headerPartial: '# Changelog\n\n',
    commitPartial:
      '{{#if subject}}* {{#if scope}}**{{scope}}:** {{/if}}{{subject}}\n{{/if}}',
    footerPartial: '',

    finalizeContent: async function (content, options) {
      // Get the Prettier config from the project root
      const prettierConfig = await prettier.resolveConfig(process.cwd());

      // Format the content with Prettier using the project's config
      return prettier.format(content, {
        ...prettierConfig,
        parser: 'markdown'
      });
    }
  }
};
