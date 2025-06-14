import React from 'react';
import { DISCORD_LINK_SELECTORS } from '../../../lib/test-selectors/components/discord-link.selectors';
import { LinkTooltip } from '../tooltip/LinkTooltip';

export const DiscordLink: React.FC = () => {
  return (
    <LinkTooltip url="https://discord.gg/mpThbx67J7">
      <a
        data-testid={DISCORD_LINK_SELECTORS.LINK}
        href="https://discord.gg/mpThbx67J7"
        target="_blank"
      >
        Discord
      </a>
    </LinkTooltip>
  );
};
