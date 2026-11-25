export interface PortfolioEnShowcaseHeaderCopy {
  eyebrow: string;
  title: string;
  subtitle: string;
  featuredLabel: string;
  totalProjectsSuffix: string;
  showingPrefix: string;
  filterNavAria: string;
}

export interface PortfolioEnCategoryCopy {
  id: string;
  label: string;
}

export interface PortfolioEnHighlightStatCopy {
  value: string;
  label: string;
}

export interface PortfolioEnAboutSectionLinkCopy {
  href: string;
  label: string;
}

export interface PortfolioEnAboutSectionCopy {
  id: string;
  title: string;
  highlights: string[];
  links?: PortfolioEnAboutSectionLinkCopy[];
}

export interface PortfolioEnAboutCopy {
  eyebrow: string;
  title: string;
  tagline: string;
  introAfterLink: string;
  statsAria: string;
  highlights: PortfolioEnHighlightStatCopy[];
  sections: PortfolioEnAboutSectionCopy[];
}

export interface PortfolioEnEcosystemTabCopy {
  id: 'overview' | 'dataflow' | 'packages';
  label: string;
}

export interface PortfolioEnEcosystemFooterCopy {
  overview: string;
  dataflow: string;
  packages: string;
}

export interface PortfolioEnEcosystemCopy {
  title: string;
  subtitle: string;
  tabs: PortfolioEnEcosystemTabCopy[];
  footer: PortfolioEnEcosystemFooterCopy;
}

export interface PortfolioEnStatsMetricLabelsCopy {
  modrinthProjects: string;
  modDownloads: string;
  modrinthFollowers: string;
  githubStars: string;
}

export interface PortfolioEnStatsQuickLinkCopy {
  href: string;
  label: string;
}

export interface PortfolioEnStatsTechCategoryCopy {
  title: string;
  badges: string[];
}

export interface PortfolioEnStatsCopy {
  modrinthMetricsTitle: string;
  technologyStackTitle: string;
  quickLinksTitle: string;
  metrics: PortfolioEnStatsMetricLabelsCopy;
  privacyNote: string;
  quickLinks: PortfolioEnStatsQuickLinkCopy[];
  techCategories: PortfolioEnStatsTechCategoryCopy[];
}

export interface PortfolioEnCopy {
  showcase: PortfolioEnShowcaseHeaderCopy;
  categories: PortfolioEnCategoryCopy[];
  totalProjectCount: number;
  about: PortfolioEnAboutCopy;
  ecosystem: PortfolioEnEcosystemCopy;
  stats: PortfolioEnStatsCopy;
}

export const PORTFOLIO_EN = {
  showcase: {
    eyebrow: 'Open-source portfolio',
    title: 'Featured Projects',
    subtitle:
      'A curated slice of the monorepo — web apps, desktop maps, Minecraft mods, serverless APIs, and shared packages.',
    featuredLabel: 'featured',
    totalProjectsSuffix: 'total projects',
    showingPrefix: 'Showing',
    filterNavAria: 'Filter projects by category',
  },
  categories: [
    { id: 'All', label: 'All' },
    { id: 'Minecraft', label: 'Minecraft' },
    { id: 'Web Tools', label: 'Web Tools' },
    { id: 'Social', label: 'Social' },
    { id: 'Streaming', label: 'Streaming' },
    { id: 'Gaming', label: 'Gaming' },
    { id: 'Infrastructure', label: 'Infrastructure' },
  ],
  totalProjectCount: 38,
  about: {
    eyebrow: 'Portfolio & ecosystem',
    title: "Hi! I'm Strixun",
    tagline:
      'Full-stack developer building production web applications, Minecraft mods, streaming tools, and cloud services.',
    introAfterLink:
      'is the home base for everything below — open source, documented, and built to ship.',
    statsAria: 'Portfolio highlights',
    highlights: [
      { value: '38+', label: 'Open-source projects' },
      { value: '7', label: 'Web applications' },
      { value: '1', label: 'Desktop map app' },
      { value: '6', label: 'Serverless APIs' },
      { value: '23', label: 'NPM packages' },
      { value: '7', label: 'Minecraft projects' },
    ],
    sections: [
      {
        id: 'minecraft',
        title: 'Minecraft Projects',
        highlights: [
          'Compressy — infinite block compression (BuiltByBit + legacy Modrinth)',
          'Offerings — premium daily kit lottery plugin',
          'Rituals — mystical magic datapack',
          'Trials of the Wild — hardcore survival modpack',
          'Alloys — ten fantasy metals datapack',
          'Tally — 10,000+ advancement completion pack',
          'Shirecraft — whitelist survival server',
          'Thousands of downloads on Mods Hub and Modrinth',
        ],
        links: [{ href: 'https://mods.idling.app', label: 'Mods Hub' }],
      },
      {
        id: 'web-tools',
        title: 'Web Applications & Tools',
        highlights: [
          'Card Generator — React 19 frontend',
          'SVG Converter — React 19 frontend',
          'URL Shortener — React + Cloudflare Worker',
          'Social Platform — Next.js 15 + PostgreSQL',
          'TypeScript, SSR, and real-time features throughout',
        ],
      },
      {
        id: 'mappy',
        title: 'mappy — interactive maps',
        highlights: [
          'Offline-first map platform for open-world games and homebrew campaigns',
          'Living map canvas, markers, progress tracking, unified search, measure tools',
          'Marker Maker, Tile Studio, and Official Map Packs',
          'Desktop app — no login, no cloud sync, no telemetry',
        ],
        links: [
          { href: 'https://short.army/mappy', label: 'Download (short.army/mappy)' },
          { href: 'https://underwood-inc.github.io/mappy/wiki/', label: 'Player wiki' },
        ],
      },
      {
        id: 'streaming',
        title: 'Streaming Ecosystem',
        highlights: [
          'OBS Animation Suite — Svelte 5, 60 FPS, 17+ effects, PWA',
          'Streamkit API — scene tracking, config sync, KV storage',
          'WebSocket control, layout presets, zero dependencies',
        ],
        links: [{ href: 'https://streamkit.idling.app', label: 'streamkit.idling.app' }],
      },
      {
        id: 'infrastructure',
        title: 'Infrastructure & APIs',
        highlights: [
          '6 Cloudflare Workers APIs — Auth, Access, Mods, Customer, Game, Streamkit',
          '23 NPM packages — shared components, API framework, auth store, search parser, and more',
          'Monorepo with 38+ projects on GitHub',
        ],
        links: [
          {
            href: 'https://github.com/Underwood-Inc/strixun-stream-suite',
            label: 'Strixun Stream Suite',
          },
        ],
      },
    ],
  },
  ecosystem: {
    title: 'Ecosystem Architecture',
    subtitle: 'How 38+ projects connect — pick a lens below',
    tabs: [
      { id: 'overview', label: 'System Overview' },
      { id: 'dataflow', label: 'Data Flow' },
      { id: 'packages', label: 'Package Ecosystem' },
    ],
    footer: {
      overview:
        'System overview: 7 web/desktop apps (including Mappy), 6 Cloudflare Workers APIs, 6 Minecraft projects via Mods API, and storage across PostgreSQL, KV, R2, and IndexedDB.',
      dataflow:
        'Data flow: Visitors, players, streamers, and map explorers each reach their app surface. Web and mods use APIs; Mappy stays offline-first with local IndexedDB — no account required.',
      packages:
        'Package ecosystem: 23 NPM packages — core framework, UI, utilities, hooks, and testing helpers — shared across React, Svelte, and Cloudflare surfaces.',
    },
  },
  stats: {
    modrinthMetricsTitle: 'Modrinth Metrics',
    technologyStackTitle: 'Technology Stack',
    quickLinksTitle: 'Quick Links',
    metrics: {
      modrinthProjects: 'Modrinth Projects',
      modDownloads: 'Mod Downloads',
      modrinthFollowers: 'Modrinth Followers',
      githubStars: 'GitHub Stars',
    },
    privacyNote:
      'Figures are from Modrinth and cover listed Minecraft projects only. BuiltByBit purchase and update metrics are not public. We do not track downloads, activity, or users on our other applications — by design, for privacy — so there are no public metrics for those projects.',
    quickLinks: [
      { href: '/card-generator', label: 'Card Generator' },
      { href: '/svg-converter', label: 'SVG Converter' },
      { href: 'https://streamkit.idling.app', label: 'OBS Suite' },
      { href: 'https://mods.idling.app', label: 'Mods Hub' },
      { href: 'https://short.army/mappy', label: 'mappy' },
      { href: 'https://auth.idling.app', label: 'Auth Service' },
      { href: 'https://docs.idling.app', label: 'Documentation' },
      { href: 'https://design.idling.app', label: 'Design System' },
      { href: 'https://short.army', label: 'URL Shortener' },
      { href: 'https://access.idling.app', label: 'Access Hub' },
      { href: '/strixun-stream-suite', label: 'Stream Suite' },
      { href: 'https://github.com/Underwood-Inc/strixun-stream-suite', label: 'Monorepo (38+)' },
      { href: 'https://github.com/Underwood-Inc/idling.app__UI', label: 'idling.app Repo' },
      { href: 'https://discord.gg/mpThbx67J7', label: 'Discord' },
    ],
    techCategories: [
      {
        title: 'Frontend',
        badges: ['React 19', 'Next.js 15', 'Svelte 5', 'TypeScript', 'Three.js'],
      },
      {
        title: 'Backend',
        badges: ['Cloudflare Workers', 'Node.js', 'WebSocket', 'Go', 'Python'],
      },
      {
        title: 'Database',
        badges: ['PostgreSQL', 'KV Storage', 'R2 Cloud'],
      },
    ],
  },
} satisfies PortfolioEnCopy;