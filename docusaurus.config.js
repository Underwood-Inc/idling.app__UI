import { themes as prismThemes } from 'prism-react-renderer';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Idling.app Documentation',
  tagline: 'Co-located Documentation for Idling.app',
  favicon: 'img/favicon.ico', // Commented out for co-located docs only

  // Set the production url of your site here
  url: 'https://underwood-inc.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/idling.app__UI/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'Underwood-Inc', // Usually your GitHub org/user name.
  projectName: 'idling.app__UI', // Usually your repo name.

  // Temporarily ignore broken links to allow search index generation
  onBrokenLinks: 'warn',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          // Co-located documentation - scan src directory for .md files
          path: 'src',
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          // docItemComponent: '@theme/ApiItem', // For OpenAPI integration (disabled for now)
          include: ['**/*.md'], // Only include .md files for now (disable .mdx to avoid Jekyll syntax conflicts)
          exclude: [
            '**/_*.{js,jsx,ts,tsx,md,mdx}',
            '**/_*/**',
            '**/*.test.{js,jsx,ts,tsx}',
            '**/__tests__/**',
            '**/pages/**', // Exclude Next.js pages directory to avoid confusion
            '**/jekyll/**', // Exclude legacy Jekyll documentation entirely
            'jekyll/**', // Also exclude from root level
          ],
        },
        // Disable pages preset to avoid routing conflicts with docs
        // pages: {
        //   // Standalone pages like homepage
        //   path: 'src/doc-pages',
        //   routeBasePath: '/',
        // },
        blog: false, // Disable blog
        theme: {
          customCss: './src/css/custom.css',
        },
      }),
    ],
  ],

  // plugins: [
  //   [
  //     'docusaurus-plugin-openapi-docs',
  //     {
  //       id: "api",
  //       docsPluginId: "classic",
  //       config: {
  //         api: {
  //           specPath: "openapi.yaml", // We'll create this
  //           outputDir: "docs/api",
  //           sidebarOptions: {
  //             groupPathsBy: "tag",
  //             categoryLinkSource: "tag",
  //           },
  //           template: "api.mustache", // Custom template
  //         },
  //       },
  //     },
  //   ],
  // ],

  markdown: {
    mermaid: true,
    // Disable MDX for existing Jekyll-syntax markdown files
    format: 'detect', // Let Docusaurus auto-detect .md vs .mdx
  },

  themes: [/* "docusaurus-theme-openapi-docs", */ "@docusaurus/theme-mermaid"],

  // 🔍 Local Search Plugin (React 19 compatible)
  plugins: [
    [
      'docusaurus-plugin-search-local',
      {
        // More comprehensive configuration
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        docsRouteBasePath: '/',
        language: ['en'],
        hashed: true,
        docsDir: ['src'],
        blogDir: [],
        removeDefaultStopWordFilter: true,
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 8,
        searchResultContextMaxLength: 50,
        explicitSearchResultPath: false,
        searchBarShortcut: true,
        searchBarShortcutHint: true,
        searchBarPosition: 'right',
        searchBarStyle: 'input',
      },
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      // image: 'img/idling-social-card.jpg', // Disabled for co-located docs
      navbar: {
        title: 'Idling.app Docs',
        // logo: {
        //   alt: 'Idling.app Logo',
        //   src: 'img/logo.svg',
        // }, // Disabled for co-located docs
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          // Temporarily removed until we have a proper API section
          // {
          //   to: '/api',
          //   label: 'API Reference',
          //   position: 'left'
          // },
          {
            href: 'https://github.com/Underwood-Inc/idling.app__UI',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Getting Started',
                to: '/',
              },
              // Temporarily removed until we have a proper API section
              // {
              //   label: 'API Reference',
              //   to: '/api',
              // },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'GitHub',
                href: 'https://github.com/Underwood-Inc/idling.app__UI',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Underwood Inc. Built with Docusaurus.`,
      },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
      },
      colorMode: {
        defaultMode: 'dark',
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      mermaid: {
        theme: {
          light: 'neutral',
          dark: 'dark',
        },
        options: {
          // Enable pan and zoom for all diagram types
          maxTextSize: 50000,
          // Enhanced styling for better visibility
          themeVariables: {
            // Dark theme colors that match our brand
            primaryColor: '#edae49',
            primaryTextColor: '#ffffff',
            primaryBorderColor: '#c68214',
            lineColor: '#f9df74',
            sectionBkgColor: '#252017',
            altSectionBkgColor: '#1a1611',
            gridColor: '#3a3323',
            tertiaryColor: '#2f2a1d',
            background: '#1a1611',
            mainBkg: '#252017',
            secondBkg: '#2f2a1d',
            tertiaryBkg: '#3a3323',
          },
          // Enable pan and zoom
          panZoom: true,
          // Flowchart specific options
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
          },
          // Sequence diagram options
          sequence: {
            useMaxWidth: false,
            wrap: true,
          },
          // Gantt chart options
          gantt: {
            useMaxWidth: false,
          },
          // Class diagram options
          class: {
            useMaxWidth: false,
          },
          // State diagram options
          state: {
            useMaxWidth: false,
          },
          // User journey options
          journey: {
            useMaxWidth: false,
          },
          // Timeline options
          timeline: {
            useMaxWidth: false,
          },
        },
      },
    }),
};

export default config; 