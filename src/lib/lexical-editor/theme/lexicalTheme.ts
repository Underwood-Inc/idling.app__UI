/**
 * Lexical Editor Theme Configuration
 *
 * Defines CSS class names for all editor elements.
 * These classes are applied to nodes and can be styled via CSS.
 */

export interface LexicalTheme {
  root: string;
  paragraph: string;
  text: {
    bold: string;
    italic: string;
    underline: string;
    strikethrough: string;
    code: string;
  };
  hashtag: string;
  mention: string;
  urlPill: string;
  urlPillEmbed: string;
  urlPillLink: string;
  urlPillModal: string;
  emoji: string;
  emojiUnicode: string;
  emojiCustom: string;
  link: string;
  list: {
    ul: string;
    ol: string;
    listitem: string;
    nested: {
      listitem: string;
    };
  };
  quote: string;
  code: string;
  codeHighlight: {
    atrule: string;
    attr: string;
    boolean: string;
    builtin: string;
    cdata: string;
    char: string;
    class: string;
    'class-name': string;
    comment: string;
    constant: string;
    deleted: string;
    doctype: string;
    entity: string;
    function: string;
    important: string;
    inserted: string;
    keyword: string;
    namespace: string;
    number: string;
    operator: string;
    prolog: string;
    property: string;
    punctuation: string;
    regex: string;
    selector: string;
    string: string;
    symbol: string;
    tag: string;
    url: string;
    variable: string;
  };
}

/**
 * Default Lexical theme with CSS class mappings
 * These classes align with the existing codebase styling conventions
 */
export const lexicalTheme: LexicalTheme = {
  // Root editor container
  root: 'lexical-editor',

  // Paragraph styling
  paragraph: 'lexical-paragraph',

  // Text formatting
  text: {
    bold: 'lexical-text--bold',
    italic: 'lexical-text--italic',
    underline: 'lexical-text--underline',
    strikethrough: 'lexical-text--strikethrough',
    code: 'lexical-text--code'
  },

  // Custom nodes - using existing class names for compatibility
  hashtag: 'content-pill content-pill--hashtag',
  mention: 'content-pill content-pill--mention',
  urlPill: 'url-pill',
  urlPillEmbed: 'url-pill url-pill--embed',
  urlPillLink: 'url-pill url-pill--link',
  urlPillModal: 'url-pill url-pill--modal',
  emoji: 'emoji',
  emojiUnicode: 'emoji emoji--unicode',
  emojiCustom: 'emoji emoji--custom',

  // Links
  link: 'lexical-link',

  // Lists
  list: {
    ul: 'lexical-list--unordered',
    ol: 'lexical-list--ordered',
    listitem: 'lexical-list__item',
    nested: {
      listitem: 'lexical-list__item--nested'
    }
  },

  // Blockquotes
  quote: 'lexical-quote',

  // Code blocks
  code: 'lexical-code',

  // Code syntax highlighting
  codeHighlight: {
    atrule: 'lexical-code--atrule',
    attr: 'lexical-code--attr',
    boolean: 'lexical-code--boolean',
    builtin: 'lexical-code--builtin',
    cdata: 'lexical-code--cdata',
    char: 'lexical-code--char',
    class: 'lexical-code--class',
    'class-name': 'lexical-code--class-name',
    comment: 'lexical-code--comment',
    constant: 'lexical-code--constant',
    deleted: 'lexical-code--deleted',
    doctype: 'lexical-code--doctype',
    entity: 'lexical-code--entity',
    function: 'lexical-code--function',
    important: 'lexical-code--important',
    inserted: 'lexical-code--inserted',
    keyword: 'lexical-code--keyword',
    namespace: 'lexical-code--namespace',
    number: 'lexical-code--number',
    operator: 'lexical-code--operator',
    prolog: 'lexical-code--prolog',
    property: 'lexical-code--property',
    punctuation: 'lexical-code--punctuation',
    regex: 'lexical-code--regex',
    selector: 'lexical-code--selector',
    string: 'lexical-code--string',
    symbol: 'lexical-code--symbol',
    tag: 'lexical-code--tag',
    url: 'lexical-code--url',
    variable: 'lexical-code--variable'
  }
};

