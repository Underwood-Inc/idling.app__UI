import { render, screen } from '@testing-library/react';
import FooterNav from './FooterNav';

// Mock the components
jest.mock('../docs-link/DocsLink', () => ({
  DocsLink: () => <div data-testid="mock-docs-link">Docs Link</div>
}));

jest.mock('../discord-link/DiscordLink', () => ({
  DiscordLink: () => <div data-testid="mock-discord-link">Discord Link</div>
}));

describe('FooterNav', () => {
  beforeEach(() => {
    render(<FooterNav />);
  });

  it('renders the component with correct structure and classes', () => {
    const container = screen.getByRole('list').parentElement;
    const listItems = screen.getAllByRole('listitem');

    expect(screen.getByRole('list')).toHaveClass('footer-nav__list');
    expect(container).toHaveClass('footer-nav__container');
    expect(listItems).toHaveLength(2);
  });

  it('renders the DocsLink and DiscordLink components', () => {
    expect(screen.getByTestId('mock-docs-link')).toBeInTheDocument();
    expect(screen.getByTestId('mock-discord-link')).toBeInTheDocument();
  });
});
