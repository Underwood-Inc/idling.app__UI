import React from 'react';
import { DISCORD_LINK_SELECTORS } from '../../../lib/utils/test-selectors/components/discord-link.selectors';

export const DiscordLink: React.FC = () => {
  return (
    <a
      data-testid={DISCORD_LINK_SELECTORS.LINK}
      href="https://discord.gg/mpThbx67J7"
      target="_blank"
    >
      Discord
    </a>
  );
};
