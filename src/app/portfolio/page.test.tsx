import React from 'react';
import { PAGE_ASIDE_SELECTORS } from 'src/lib/test-selectors/components/page-aside.selectors';
import { render, screen } from '../../test-utils';
import Page from './page';

vi.mock('../components/page-container/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-container">{children}</div>
  )
}));

vi.mock('../components/page-header/PageHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-header">{children}</div>
  )
}));

vi.mock('../components/page-content/PageContent', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-content">{children}</div>
  )
}));

vi.mock('../components/stats-dashboard/StatsDashboard', () => ({
  StatsDashboard: () => (
    <div data-testid="mock-stats-dashboard">Stats Dashboard</div>
  )
}));

describe('Portfolio page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('when a visitor opens the long version, the original about, projects, and stats are still there', async () => {
    const { container } = render(await Page());

    expect(screen.getByTestId('mock-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-page-content')).toBeInTheDocument();
    expect(screen.getByText("Hi! I'm Strixun")).toBeInTheDocument();

    const article = container.querySelector('article');
    const cards = article?.querySelectorAll('.card');
    expect(cards).toHaveLength(3);

    expect(screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)).toBeInTheDocument();
    expect(screen.getByTestId(PAGE_ASIDE_SELECTORS.ASIDE)).toBeInTheDocument();
    expect(screen.getByTestId('mock-stats-dashboard')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-recent-activity-feed')).not.toBeInTheDocument();
    expect(document.getElementById('about')).toBeInTheDocument();
    expect(document.getElementById('ecosystem')).toBeInTheDocument();
    expect(document.getElementById('projects')).toBeInTheDocument();
    expect(document.querySelector('#activity')).not.toBeInTheDocument();
    expect(document.getElementById('stats')).toBeInTheDocument();
  });
});
