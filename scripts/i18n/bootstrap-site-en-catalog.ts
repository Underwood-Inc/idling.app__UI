/**
 * One-shot / refresh helper: merge hard-coded English UI copy into src/i18n/locales/en.json.
 * Run: pnpm exec tsx scripts/i18n/bootstrap-site-en-catalog.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { HOME_HUB_CONTENT } from '../../src/app/components/marketing-dashboard/homeHubContent';
import {
  DASHBOARD_COPY,
  PRODUCT_AUDIENCE_LINES,
  PRODUCT_MARKETING_HOOKS,
} from '../../src/app/components/marketing-dashboard/productMarketing';
import { NAV_GROUPS, NAV_PATH_LABELS, ROUTE_KEYS } from '../../src/lib/routes';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EN_PATH = path.join(ROOT, 'src/i18n/locales/en.json');

export interface SiteEnCatalog {
  locale: Record<string, string>;
  messageTicker: Record<string, string>;
  nav: {
    externalLinkAria: string;
    groups: Record<string, string>;
    routes: Record<string, string>;
  };
  auth: {
    signIn: string;
  };
  search: {
    findUsersPlaceholder: string;
  };
  mobile: {
    brandTitle: string;
    closeMenuAria: string;
  };
  footer: {
    docs: string;
    discord: string;
    discordAria: string;
  };
  home: {
    masthead: {
      title: string;
      line: string;
      ctaSeeLineup: string;
    };
    minecraftBand: {
      title: string;
      line: string;
    };
    hubEyebrow: {
      windowsProprietary: string;
    };
    status: {
      wip: string;
    };
    homeLinks: Record<string, string>;
    outboundLinks: Record<string, string>;
    outboundVariants: {
      inDepthTour: string;
      launchLiveApp: string;
    };
    minecraftMore: Record<string, string>;
    hooks: Record<string, string>;
    audience: Record<string, string>;
    hub: Record<
      string,
      {
        headline: string;
        pitch: string;
        learnMoreLabel: string;
        visualAlt: string;
        highlights: Record<string, { title: string; body: string }>;
      }
    >;
  };
}

function slugHighlightKey(projectId: string, index: number, title: string): string {
  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  return `${projectId}__${index}__${fromTitle || 'item'}`;
}

function projectIdToJsonKey(projectId: string): string {
  return projectId.replace(/-/g, '_');
}

function buildCatalog(): SiteEnCatalog {
  const existing = JSON.parse(fs.readFileSync(EN_PATH, 'utf8')) as Partial<SiteEnCatalog>;

  const hub: SiteEnCatalog['home']['hub'] = {};
  for (const entry of HOME_HUB_CONTENT) {
    const highlights: Record<string, { title: string; body: string }> = {};
    entry.highlights.forEach((item, index) => {
      highlights[slugHighlightKey(entry.projectId, index, item.title)] = {
        title: item.title,
        body: item.body,
      };
    });
    hub[projectIdToJsonKey(entry.projectId)] = {
      headline: entry.headline,
      pitch: entry.pitch,
      learnMoreLabel: entry.learnMoreLabel,
      visualAlt: entry.visual.alt,
      highlights,
    };
  }

  const hooks: Record<string, string> = {};
  const audience: Record<string, string> = {};
  for (const [id, text] of Object.entries(PRODUCT_MARKETING_HOOKS)) {
    hooks[projectIdToJsonKey(id)] = text;
  }
  for (const [id, text] of Object.entries(PRODUCT_AUDIENCE_LINES)) {
    audience[projectIdToJsonKey(id)] = text;
  }

  const groups: Record<string, string> = {};
  for (const [key, group] of Object.entries(NAV_GROUPS)) {
    groups[key] = group.label;
  }

  const routes: Record<string, string> = {};
  for (const key of Object.values(ROUTE_KEYS)) {
    routes[key] = NAV_PATH_LABELS[key];
  }

  return {
    locale: {
      pickerLabel: 'Language',
      pickerAria: 'Choose display language',
      ...(existing.locale ?? {}),
    },
    messageTicker: (existing.messageTicker ?? {
      separator: ' — ',
      loading: 'Loading…',
      empty: 'Take a mindful breath.',
      openQuoteAria: 'Open full quote',
      modalTitle: 'Quote',
      closeModalAria: 'Close quote',
    }) as Record<string, string>,
    nav: {
      externalLinkAria: 'External link',
      groups,
      routes,
    },
    auth: {
      signIn: 'Sign In',
    },
    search: {
      findUsersPlaceholder: 'Find users...',
    },
    mobile: {
      brandTitle: 'Idling.app',
      closeMenuAria: 'Close mobile menu',
    },
    footer: {
      docs: 'Docs',
      discord: 'Discord',
      discordAria: 'Join our Discord server',
    },
    home: {
      masthead: {
        title: DASHBOARD_COPY.title,
        line: DASHBOARD_COPY.line,
        ctaSeeLineup: 'See the lineup',
      },
      minecraftBand: {
        title: 'More Minecraft projects',
        line: 'Plugins, datapacks, and our whitelist server — same lineup as Modrinth and BuiltByBit.',
      },
      hubEyebrow: {
        windowsProprietary: 'Windows app · proprietary',
      },
      status: {
        wip: 'In progress',
      },
      homeLinks: {
        open: 'Open',
        getIt: 'Get it',
        modsHub: 'Mods Hub',
        modrinth: 'Modrinth',
        tour: 'Tour',
      },
      outboundLinks: {
        live: 'Live app',
        builtByBit: 'BuiltByBit',
        modsHub: 'Mods Hub',
        modrinth: 'Modrinth',
        demo: 'Product tour',
        github: 'GitHub',
      },
      outboundVariants: {
        inDepthTour: 'In-depth tour',
        launchLiveApp: 'Launch live app',
      },
      minecraftMore: {
        productTour: 'Product tour',
        seeTour: 'See tour',
        modrinthPage: 'Modrinth page',
        builtByBitListing: 'BuiltByBit listing',
        onIdlingApp: 'On idling.app',
      },
      hooks,
      audience,
      hub,
    },
  };
}

const catalog = buildCatalog();
fs.writeFileSync(EN_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${EN_PATH} (${Object.keys(catalog.home.hub).length} hub chapters)`);