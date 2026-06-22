import React from 'react';
import { PAGE_ASIDE_SELECTORS } from 'src/lib/test-selectors/components/page-aside.selectors';
import { render, screen } from '../test-utils';
import Page from './page';

// Keep original simple mocks
vi.mock('./components/page-container/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-container">{children}</div>
  )
}));

vi.mock('./components/page-header/PageHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-header">{children}</div>
  )
}));

vi.mock('./components/page-content/PageContent', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-content">{children}</div>
  )
}));

// Mock RecentActivityFeed to prevent next-auth import issues
vi.mock('./components/recent-activity-feed', () => ({
  RecentActivityFeed: () => (
    <div data-testid="mock-recent-activity-feed">Recent Activity Feed</div>
  )
}));

vi.mock('./components/stats-dashboard/StatsDashboard', () => ({
  StatsDashboard: () => (
    <div data-testid="mock-stats-dashboard">Stats Dashboard</div>
  )
}));

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the page with correct structure and content', async () => {
    const { container } = render(await Page());

    // Check page structure
    expect(screen.getByTestId('mock-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-page-content')).toBeInTheDocument();
    // Check for the About section heading
    expect(screen.getByText("Hi! I'm Strixun")).toBeInTheDocument();

    // Check layout and sidebar content
    const article = container.querySelector('article');
    const cards = article?.querySelectorAll('.card');
    expect(cards).toHaveLength(4); // About, Ecosystem, Projects, and Activity cards

    expect(
      screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)
    ).toBeInTheDocument();
    expect(screen.getByTestId(PAGE_ASIDE_SELECTORS.ASIDE)).toBeInTheDocument();
    expect(screen.getByTestId('mock-stats-dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('mock-recent-activity-feed')).toBeInTheDocument();
  });
});
