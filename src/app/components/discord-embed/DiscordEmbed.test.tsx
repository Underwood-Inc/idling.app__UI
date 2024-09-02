import { render } from '@testing-library/react';
import { DISCORD_EMBED_SELECTORS } from '../../../lib/test-selectors/components/discord-embed.selectors';
import { DiscordEmbed } from './DiscordEmbed';

describe('DiscordEmbed', () => {
  it('renders the iframe with correct attributes', () => {
    const { getByTestId } = render(<DiscordEmbed />);
    const iframe = getByTestId(DISCORD_EMBED_SELECTORS.IFRAME);

    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveClass('discord-embed');
    expect(iframe).toHaveAttribute(
      'src',
      'https://discord.com/widget?id=1234783462335189080&theme=dark'
    );
    expect(iframe).toHaveAttribute('width', '350');
    expect(iframe).toHaveAttribute('height', '600');
    expect(iframe).toHaveAttribute('allowtransparency', 'true');
    expect(iframe).toHaveAttribute('frameBorder', '0');
    expect(iframe).toHaveAttribute(
      'sandbox',
      'allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts'
    );
  });
});
