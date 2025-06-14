import { render, screen } from '@testing-library/react';
import { DISCORD_LINK_SELECTORS } from 'src/lib/test-selectors/components/discord-link.selectors';
import { PAGE_ASIDE_SELECTORS } from 'src/lib/test-selectors/components/page-aside.selectors';
import Page from './page';

// Keep original simple mocks
jest.mock('./components/page-container/PageContainer', () => ({
  PageContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-container">{children}</div>
  )
}));

jest.mock('./components/page-header/PageHeader', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-header">{children}</div>
  )
}));

jest.mock('./components/page-content/PageContent', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-page-content">{children}</div>
  )
}));

describe('Home Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the page with correct structure and content', async () => {
    const { container } = render(await Page());

    // Check page structure
    expect(screen.getByTestId('mock-page-container')).toBeInTheDocument();
    expect(screen.getByTestId('mock-page-header')).toBeInTheDocument();
    expect(screen.getByTestId('mock-page-content')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(
      'About'
    );

    // Check layout and Discord content
    const article = container.querySelector('article');
    const cards = article?.querySelectorAll('.card');
    expect(cards).toHaveLength(2);

    const discordCard = cards?.[1];
    const paragraphs = discordCard?.querySelectorAll('p');
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs?.[0]).toHaveTextContent(/Join our.*Discord/);
    expect(paragraphs?.[1]).toHaveTextContent(/See a bug\?.*Discord/);

    expect(
      screen.getByTestId(PAGE_ASIDE_SELECTORS.CONTAINER)
    ).toBeInTheDocument();
    expect(screen.getByTestId(PAGE_ASIDE_SELECTORS.ASIDE)).toBeInTheDocument();

    // Check Discord links
    const discordLinks = screen.getAllByTestId(DISCORD_LINK_SELECTORS.LINK);
    expect(discordLinks).toHaveLength(3);
    expect(discordLinks[0]).toHaveAttribute(
      'href',
      'https://discord.gg/mpThbx67J7'
    );
    expect(discordLinks[0]).toHaveAttribute('target', '_blank');
  });
});
