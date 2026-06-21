import { NAV_PATHS } from '../../../lib/routes';
import { ABOUT_PAGE_SELECTORS } from '../../../lib/test-selectors/pages/about.selectors';
import { render, screen } from '../../../test-utils';
import { About } from './About';

describe('About', () => {
  it('renders the about section with portfolio highlights and mappy links', () => {
    render(<About />);

    expect(screen.getByTestId(ABOUT_PAGE_SELECTORS.ROOT_LINK))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', NAV_PATHS.ROOT)
      .not.toHaveAttribute('target', '_blank');

    expect(screen.getByText("Hi! I'm Strixun 👋")).toBeInTheDocument();
    expect(screen.getByText('Mappy — Interactive Maps')).toBeInTheDocument();
    expect(screen.getByText('38+')).toBeInTheDocument();

    const mappyDownloadLink = screen.getByRole('link', {
      name: /download \(short\.army\/mappy\)/i,
    });
    expect(mappyDownloadLink)
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', NAV_PATHS.MAPPY)
      .toHaveAttribute('target', '_blank');
  });
});
