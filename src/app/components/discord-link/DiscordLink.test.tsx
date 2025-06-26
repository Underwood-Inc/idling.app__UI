import { render, screen } from '@testing-library/react';
import { DISCORD_LINK_SELECTORS } from '../../../lib/test-selectors/components/discord-link.selectors';
import { DiscordLink } from './DiscordLink';

describe('Discord Link', () => {
  it('renders the Discord link', () => {
    render(<DiscordLink isInsideParagraph={false} />);

    const linkElement = screen.getByTestId(DISCORD_LINK_SELECTORS.LINK);

    expect(linkElement).toBeVisible();
    expect(linkElement).toBeEnabled();
    expect(linkElement).toHaveAttribute(
      'href',
      'https://discord.gg/mpThbx67J7'
    );
    expect(linkElement).toHaveAttribute('target', '_blank');
  });

  it('has the correct text content', () => {
    render(<DiscordLink isInsideParagraph={false} />);

    const linkElement = screen.getByTestId(DISCORD_LINK_SELECTORS.LINK);

    expect(linkElement).toHaveTextContent('Discord');
  });

  it('has the correct tooltip text', () => {
    render(<DiscordLink isInsideParagraph />);

    const linkElement = screen.getByTestId(DISCORD_LINK_SELECTORS.LINK);

    expect(linkElement).toHaveTextContent('Discord');
    expect(linkElement).toHaveAttribute(
      'href',
      'https://discord.gg/mpThbx67J7'
    );
    expect(linkElement).toHaveAttribute('target', '_blank');
    expect(linkElement).toHaveAttribute('rel', 'noopener noreferrer');
    expect(linkElement).toHaveAttribute(
      'aria-label',
      'Join our Discord server'
    );
    expect(linkElement).toHaveAttribute(
      'aria-describedby',
      'discord-link-tooltip'
    );
    expect(linkElement).toHaveAttribute(
      'aria-labelledby',
      'discord-link-tooltip'
    );
  });
});
