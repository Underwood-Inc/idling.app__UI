/**
 * Merge site UI copy into src/i18n/locales/en.json — chrome, marketing, showcase, suite, tools, admin, errors.
 * Run: pnpm i18n:bootstrap-site
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { DASHBOARD_COPY } from '../../src/app/components/marketing-dashboard/productMarketing.ts';
import enExisting from '../../src/i18n/locales/en.json' with { type: 'json' };
import { getHomeHubContentEntry } from '../../src/app/components/marketing-dashboard/homeHubContent.ts';
import { HOME_HUB_STRUCTURE } from '../../src/app/components/marketing-dashboard/homeHubContent.ts';
import { PROJECT_SHOWCASE_PROJECTS } from '../../src/app/components/project-showcase/projectShowcaseProjects.ts';
import { STRIXUN_SUITE_PRODUCT_COPY_EN } from '../../src/app/strixun-stream-suite/strixunSuiteProducts.ts';
import {
  ADMIN_EN,
  AUTH_EN,
  COMMON_EN,
  ERRORS_EN,
  META_EN,
  PORTFOLIO_EN,
  PROFILE_EN,
  SUITE_DETAILS_EN,
  SUITE_LANDING_EN,
  SETTINGS_EN,
  TOOLS_CARD_GENERATOR_EN,
  TOOLS_SVG_CONVERTER_EN,
  SUBSCRIPTION_EN,
  RADIO_EN,
} from '../../src/i18n-en-catalog/index.ts';
import { NAV_GROUPS, NAV_PATH_LABELS, ROUTE_KEYS } from '../../src/lib/routes.ts';
import { idlingProductI18nKey } from '../../src/molecules/i18n/idlingProductI18nKey.ts';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..');
const EN_PATH = path.join(ROOT, 'src/i18n/locales/en.json');

function slugHighlightKey(projectId: string, index: number, title: string): string {
  const fromTitle = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 48);
  return `${projectId}__${index}__${fromTitle || 'item'}`;
}

function buildHomeHub(): Record<string, unknown> {
  const hub: Record<string, unknown> = {};
  for (const entry of HOME_HUB_STRUCTURE) {
    const content = getHomeHubContentEntry(entry.projectId);
    if (!content) {
      continue;
    }
    const highlights: Record<string, { title: string; body: string }> = {};
    content.highlights.forEach((item, index) => {
      highlights[slugHighlightKey(entry.projectId, index, item.title)] = {
        title: item.title,
        body: item.body,
      };
    });
    hub[idlingProductI18nKey(entry.projectId)] = {
      headline: content.headline,
      pitch: content.pitch,
      learnMoreLabel: content.learnMoreLabel,
      visualAlt: content.visual.alt,
      highlights,
    };
  }
  return hub;
}

function buildShowcaseCatalog(): Record<string, unknown> {
  const catalog: Record<string, unknown> = {};
  for (const project of PROJECT_SHOWCASE_PROJECTS) {
    catalog[idlingProductI18nKey(project.id)] = {
      title: project.title,
      description: project.description,
      type: project.type,
      features: project.features,
    };
  }
  return catalog;
}

function buildSuiteProducts(): Record<string, unknown> {
  const products: Record<string, unknown> = {};
  for (const [id, copy] of Object.entries(STRIXUN_SUITE_PRODUCT_COPY_EN)) {
    products[id.replace(/-/g, '_')] = copy;
  }
  return products;
}

function buildAdminTabsForTypesafe(): Record<string, { label: string; description: string }> {
  const tabs: Record<string, { label: string; description: string }> = {};
  for (const tab of ADMIN_EN.dashboard.tabs) {
    tabs[tab.id] = { label: tab.label, description: tab.description };
  }
  return tabs;
}

function buildAdminCatalog(): Record<string, unknown> {
  const { dashboard, ...rest } = ADMIN_EN;
  return {
    dashboard: {
      title: dashboard.title,
      tabs: buildAdminTabsForTypesafe(),
    },
    ...rest,
  };
}

function buildHooksAndAudience(): { hooks: Record<string, string>; audience: Record<string, string> } {
  const home = enExisting.home as { hooks?: Record<string, string>; audience?: Record<string, string> };
  return {
    hooks: home?.hooks ?? {},
    audience: home?.audience ?? {},
  };
}

function buildRoutes(): Record<string, string> {
  const routes: Record<string, string> = {};
  for (const key of Object.values(ROUTE_KEYS)) {
    routes[key] = NAV_PATH_LABELS[key];
  }
  return routes;
}

function buildGroups(): Record<string, string> {
  const groups: Record<string, string> = {};
  for (const [key, group] of Object.entries(NAV_GROUPS)) {
    groups[key] = group.label;
  }
  return groups;
}

const { hooks, audience } = buildHooksAndAudience();

const catalog = {
  locale: {
    pickerLabel: 'Language',
    pickerAria: 'Choose display language',
  },
  messageTicker: {
    separator: ' — ',
    loading: 'Loading…',
    empty: 'Take a mindful breath.',
    openQuoteAria: 'Open full quote',
    modalTitle: 'Quote',
    closeModalAria: 'Close quote',
  },
  nav: {
    externalLinkAria: 'External link',
    groups: buildGroups(),
    routes: buildRoutes(),
  },
  auth: AUTH_EN,
  search: {
    findUsersPlaceholder: 'Find users...',
  },
  mobile: {
    brandTitle: 'Idling.app',
    closeMenuAria: 'Close mobile menu',
    menuAria: 'Mobile navigation menu',
  },
  footer: {
    docs: 'Docs',
    discord: 'Discord',
    discordAria: 'Join our Discord server',
  },
  meta: META_EN,
  common: COMMON_EN,
  errors: ERRORS_EN,
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
    hub: buildHomeHub(),
  },
  catalog: {
    showcase: buildShowcaseCatalog(),
  },
  suite: {
    landing: SUITE_LANDING_EN,
    products: buildSuiteProducts(),
    details: SUITE_DETAILS_EN,
  },
  portfolio: PORTFOLIO_EN,
  profile: PROFILE_EN,
  admin: buildAdminCatalog(),
  settings: SETTINGS_EN,
  tools: {
    cardGenerator: TOOLS_CARD_GENERATOR_EN,
    svgConverter: TOOLS_SVG_CONVERTER_EN,
  },
  subscription: SUBSCRIPTION_EN,
  radio: RADIO_EN,
};

fs.writeFileSync(EN_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
console.log(`Wrote ${EN_PATH}`);