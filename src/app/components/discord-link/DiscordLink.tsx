import { DISCORD_LINK_SELECTORS } from '@lib/test-selectors/components/discord-link.selectors';
import React from 'react';
import { LinkTooltip } from '../tooltip/LinkTooltip';

export interface DiscordLinkProps {
  isInsideParagraph?: boolean;
}

export const DiscordLink: React.FC<DiscordLinkProps> = ({
  isInsideParagraph = false
}) => {
  return (
    <LinkTooltip
      url="https://discord.gg/mpThbx67J7"
      isInsideParagraph={isInsideParagraph}
    >
      <a
        data-testid={DISCORD_LINK_SELECTORS.LINK}
        href="https://discord.gg/mpThbx67J7"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Join our Discord server"
        aria-describedby="discord-link-tooltip"
        aria-labelledby="discord-link-tooltip"
      >
        Discord
      </a>
    </LinkTooltip>
  );
};
