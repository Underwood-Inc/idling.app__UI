import { PROJECT_SHOWCASE_PROJECTS } from '../project-showcase/projectShowcaseProjects';
import { listHomeHubChapters } from './homeHubCatalog';
import {
  FEATURED_PRODUCT_IDS,
  HOME_PRODUCT_IDS,
  getHomeProductPrimaryLink,
  listHomeFilmstripProjects,
  listHomeMarketingTiles,
  listHomeMinecraftProjects,
  getProductMarketingPrimaryLink,
  getProductMarketingProject,
  listFeaturedProductProjects,
  listHomeAudienceProjects,
  listProductMarketingIds,
  productMarketingAudienceLine,
  productMarketingHook,
  productMarketingSummary,
} from './productMarketing';

test('when products are listed for marketing, every showcase id resolves to project data', () => {
  const ids = listProductMarketingIds();

  expect(ids.length).toBe(PROJECT_SHOWCASE_PROJECTS.length);
  expect(new Set(ids).size).toBe(ids.length);

  for (const id of ids) {
    expect(getProductMarketingProject(id)?.title).toBeTruthy();
  }
});

test('when featured slots are configured, they map to real projects and stay separate from the full grid', () => {
  const featured = listFeaturedProductProjects();

  expect(featured.map((project) => project.id)).toEqual([...FEATURED_PRODUCT_IDS]);
  expect(productMarketingHook(featured[0]).length).toBeGreaterThan(0);
});

test('when a showcase project has outbound links, the primary link prefers live then tour then repo', () => {
  const mappy = getProductMarketingProject('mappy');
  expect(getProductMarketingPrimaryLink(mappy!)?.href).toBe(mappy!.links.live);

  const auth = getProductMarketingProject('auth-service');
  const authPrimary = getProductMarketingPrimaryLink(auth!);
  expect(authPrimary).toBeTruthy();
  expect(authPrimary!.external).toBe(authPrimary!.href.startsWith('http'));
});

test('when the home hub is built, chapters include Overlane first with visitor copy', () => {
  const chapters = listHomeHubChapters();

  expect(chapters[0]?.project.id).toBe('overlane');
  expect(chapters[0]?.proprietary).toBe(true);
  expect(chapters[0]?.project.status).toBe('Beta');
  expect(chapters[0]?.pitch).toMatch(/dashboard charts/i);
  expect(chapters[0]?.pitch).toMatch(/hot\/cold/i);
});

test('when mods hub and overlane are in the catalog, they are marked Beta for visitors', () => {
  expect(getProductMarketingProject('overlane')?.status).toBe('Beta');
  expect(getProductMarketingProject('mods-hub')?.status).toBe('Beta');
});

test('when the home hub is built, Offerings is the featured minecraft chapter and Compressy stays on the minecraft shelf', () => {
  const chapters = listHomeHubChapters();
  const minecraft = listHomeMinecraftProjects();

  expect(chapters.map((chapter) => chapter.project.id)).toContain('offerings');
  expect(chapters.map((chapter) => chapter.project.id)).not.toContain('compressy');
  expect(minecraft.map((project) => project.id)).toContain('compressy');
  expect(minecraft.map((project) => project.id)).not.toContain('offerings');

  const offerings = chapters.find((chapter) => chapter.project.id === 'offerings');
  expect(offerings?.visual.src).toBe('/marketing/offerings-icon-1x1.png');
});

test('when a product summary is built for the home spotlight, it uses real showcase sentences', () => {
  const mappy = getProductMarketingProject('mappy');
  const summary = productMarketingSummary(mappy!);

  expect(summary.length).toBeGreaterThan(40);
  expect(summary).toMatch(/offline-first/i);
  expect(summary).not.toBe(productMarketingHook(mappy!));
});

test('when the home product list is built, featured projects precede minecraft mods without duplicates', () => {
  const projects = listHomeFilmstripProjects();
  const ids = projects.map((project) => project.id);

  expect(projects.length).toBeGreaterThan(8);
  expect(new Set(ids).size).toBe(ids.length);
  expect(ids[0]).toBe('overlane');
  expect(ids).toContain('offerings');
  expect(ids).not.toContain('auth-service');
});

test('when home tiles are built for legacy helpers, featured rows precede minecraft chips without duplicates', () => {
  const tiles = listHomeMarketingTiles();
  const ids = tiles.map((tile) => tile.project.id);

  expect(tiles.filter((tile) => tile.size === 'hero')).toHaveLength(2);
  expect(tiles.filter((tile) => tile.size === 'chip').length).toBeGreaterThan(3);
  expect(new Set(ids).size).toBe(ids.length);
});

test('when the minecraft shelf is built, it lists player mods with consumer links', () => {
  const minecraft = listHomeMinecraftProjects();

  expect(minecraft.length).toBeGreaterThan(3);
  expect(minecraft.every((project) => project.category === 'Minecraft')).toBe(true);
});

test('when the home allowlist is built, it omits infra and never surfaces GitHub-only destinations', () => {
  const homeIds = listHomeAudienceProjects().map((project) => project.id);

  expect(homeIds.length).toBe(HOME_PRODUCT_IDS.length);
  expect(homeIds.length).toBeLessThanOrEqual(7);
  expect(homeIds).not.toContain('auth-service');
  expect(homeIds).not.toContain('api-framework');

  for (const id of homeIds) {
    const project = getProductMarketingProject(id)!;
    const homeLink = getHomeProductPrimaryLink(project);
    expect(homeLink).toBeTruthy();
    expect(homeLink!.label).not.toBe('GitHub');
  }
});