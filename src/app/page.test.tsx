import React from 'react';
import { render, screen } from '../test-utils';
import { getHomeProductPrimaryLink } from './components/marketing-dashboard/productMarketing';
import { PROJECT_SHOWCASE_PROJECTS } from './components/project-showcase/projectShowcaseProjects';
import Page from './page';

vi.mock('./components/page-container/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-container">{children}</div>
  ),
}));

test('when a guest opens the marketing home, an Apple-style product hub renders without catalog sidebar or feed widgets', () => {
  render(<Page />);

  expect(
    screen.getByRole('heading', { level: 1, name: 'Maps. Mods. Tools. Radio.' })
  ).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'See the lineup' })).toHaveAttribute('href', '#products');
  expect(document.getElementById('products')).toBeInTheDocument();
  expect(screen.getByTestId('home-product-hub')).toBeInTheDocument();
  expect(screen.queryByTestId('page-aside-container')).not.toBeInTheDocument();
  expect(screen.queryByTestId('mock-recent-activity-feed')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: /open-source portfolio/i })).not.toBeInTheDocument();

  expect(
    screen.getByRole('heading', { level: 2, name: /Telemetry, overlays, and a drive archive/i })
  ).toBeInTheDocument();
  expect(screen.getByText(/Offline-first map workspace/i)).toBeInTheDocument();
  expect(screen.queryByText(/live map/i)).not.toBeInTheDocument();

  const mappy = PROJECT_SHOWCASE_PROJECTS.find((project) => project.id === 'mappy');
  expect(mappy).toBeDefined();
  const primary = getHomeProductPrimaryLink(mappy!);
  const mappyOpen = screen
    .getAllByRole('link', { name: primary!.label })
    .find((element) => element.getAttribute('href') === primary!.href);
  expect(mappyOpen).toBeDefined();

  expect(screen.getByRole('heading', { level: 2, name: /Daily kit lottery/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: 'Player wiki tour' })).toHaveAttribute(
    'href',
    'https://underwood-inc.github.io/mappy/wiki/'
  );
  expect(screen.getByRole('link', { name: 'Stream Suite tour' })).toBeInTheDocument();
});