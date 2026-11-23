import { render, screen } from '../../../test-utils';
import { getProductMarketingProject } from '../../components/marketing-dashboard/productMarketing';
import ProductPage from './page';

test('when a visitor opens mappy, the product page shows summary, highlights, and outbound links', async () => {
  render(await ProductPage({ params: Promise.resolve({ id: 'mappy' }) }));

  expect(screen.getByRole('heading', { level: 1, name: 'mappy' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { level: 3, name: 'Offline map workspace' })).toBeInTheDocument();
  expect(screen.getByText(/Pan, zoom, layer, and track progress/i)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Launch live app/ })).toHaveAttribute(
    'href',
    'https://short.army/mappy'
  );
  expect(screen.getByRole('link', { name: /Back home/ })).toHaveAttribute('href', '/');
  expect(screen.getByRole('heading', { level: 2, name: 'Built With' })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /Tauri/i })).toHaveAttribute('href', 'https://tauri.app/');
});

test('when a visitor opens Mods Hub, the in-depth tour route is offered', async () => {
  render(await ProductPage({ params: Promise.resolve({ id: 'mods-hub' }) }));

  expect(screen.getByRole('link', { name: /Open product tour/ })).toHaveAttribute(
    'href',
    '/strixun-stream-suite/mods-hub'
  );
  expect(screen.getByText(/Beta/)).toBeInTheDocument();
});

test('when a visitor opens Overlane, the product page shows Beta status', async () => {
  render(await ProductPage({ params: Promise.resolve({ id: 'overlane' }) }));

  expect(screen.getByText(/Beta/)).toBeInTheDocument();
});

test('when a visitor opens Compressy, the Modrinth download caveat stays on the page', async () => {
  const project = getProductMarketingProject('compressy');

  render(await ProductPage({ params: Promise.resolve({ id: 'compressy' }) }));

  expect(screen.getByText(project?.modrinthMetricsNote ?? '')).toBeInTheDocument();
});

test('when the product id is not in the catalog, the page refuses to invent one', async () => {
  await expect(
    ProductPage({ params: Promise.resolve({ id: 'not-a-product' }) })
  ).rejects.toThrow('NEXT_NOT_FOUND');
});