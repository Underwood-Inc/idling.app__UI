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
        // Minimal, valid configuration
        indexDocs: true,
        indexBlog: false,
        docsRouteBasePath: '/',
        hashed: true,
      },
    ],
  ],

  // Custom scripts for enhanced functionality
  scripts: [
    {
      src: '/js/mermaid-viewer.js',
      async: true,
    },
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
          // Enhanced diagram viewing capabilities
          maxTextSize: 50000,
          
          // Enable comprehensive pan and zoom for all diagram types
          panZoom: true,
          
          // Enhanced security and rendering options
          securityLevel: 'loose',
          startOnLoad: true,
          htmlLabels: true,
          
          // Improved layout and spacing
          er: {
            useMaxWidth: false,
            entityPadding: 15,
            fontSize: 14,
          },
          
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
          
          // Flowchart specific options with enhanced interactivity
          flowchart: {
            useMaxWidth: false,
            htmlLabels: true,
            curve: 'cardinalClosed',
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 100,
            diagramPadding: 20,
          },
          
          // Sequence diagram options with better spacing
          sequence: {
            useMaxWidth: false,
            wrap: true,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            bottomMarginAdj: 1,
          },
          
          // Class diagram options with better layout
          class: {
            useMaxWidth: false,
            titleTopMargin: 25,
            arrowMarkerAbsolute: false,
            dividerMargin: 10,
            padding: 5,
            textHeight: 14,
          },
          
          // State diagram options
          state: {
            useMaxWidth: false,
            dividerMargin: 10,
            sizeUnit: 5,
            padding: 8,
            textHeight: 16,
            titleShift: -15,
            noteMargin: 10,
            forkWidth: 70,
            forkHeight: 7,
            miniMumStateDiagramWidth: 1,
            fontSize: 12,
          },
          
                     // Gantt chart options with enhanced readability
           gantt: {
             useMaxWidth: false,
             titleTopMargin: 25,
             barHeight: 20,
             fontSizeSection: 24,
             fontSizeTask: 14,
             fontSizeAxis: 12,
             numberSectionStyles: 4,
             axisFormat: '%Y-%m-%d',
             topPadding: 50,
             leftPadding: 75,
             gridLineStartPadding: 35,
             fontSize: 11,
             fontFamily: '"Fira Code", monospace',
           },
          
          // User journey options
          journey: {
            useMaxWidth: false,
            diagramMarginX: 50,
            diagramMarginY: 10,
            actorMargin: 50,
            width: 150,
            height: 65,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            bottomMarginAdj: 1,
          },
          
          // Timeline options
          timeline: {
            useMaxWidth: false,
            diagramMarginX: 50,
            diagramMarginY: 10,
            leftMargin: 150,
            width: 150,
            height: 50,
            boxMargin: 10,
            boxTextMargin: 5,
            noteMargin: 10,
            messageMargin: 35,
            bottomMarginAdj: 1,
          },
          
          // Git graph options
          gitGraph: {
            useMaxWidth: false,
            titleTopMargin: 25,
            diagramPadding: 8,
            nodeLabel: {
              width: 75,
              height: 100,
              x: -25,
              y: -8,
            },
            mainBranchName: 'main',
            showCommitLabel: true,
            showBranches: true,
            rotateCommitLabel: true,
          },
          
          // C4 Context options
          c4: {
            useMaxWidth: false,
            diagramMarginX: 50,
            diagramMarginY: 10,
            c4ShapeMargin: 50,
            c4ShapePadding: 20,
            width: 216,
            height: 60,
            boxMargin: 10,
            c4ShapeInRow: 4,
            nextLinePaddingX: 0,
            c4BoundaryInRow: 2,
            personFontSize: 14,
            personFontFamily: '"Fira Code", monospace',
            personFontWeight: 'normal',
          },
        },
      },
    }),
};

export default config; 