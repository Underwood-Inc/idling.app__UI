import { render, screen } from '@testing-library/react';
import { DISCORD_LINK_SELECTORS } from '../../../lib/utils/test-selectors/components/discord-link.selectors';
import { DiscordLink } from './DiscordLink';

describe('Discord Link', () => {
  it('renders the Discord link', () => {
    render(<DiscordLink />);

    screen.findByRole('heading');

    expect(screen.getByTestId(DISCORD_LINK_SELECTORS.LINK))
      .toBeVisible()
      .toBeEnabled()
      .toHaveAttribute('href', 'https://discord.gg/mpThbx67J7')
      .toHaveAttribute('target', '_blank');
  });
});
