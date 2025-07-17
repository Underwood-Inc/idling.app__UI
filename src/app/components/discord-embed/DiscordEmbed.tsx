'use client';
import { DISCORD_EMBED_SELECTORS } from '@lib/test-selectors/components/discord-embed.selectors';
import React from 'react';
import './DiscordEmbed.css';

export const DiscordEmbed: React.FC = () => {
  return (
    <iframe
      data-testid={DISCORD_EMBED_SELECTORS.IFRAME}
      className="discord-embed"
      src="https://discord.com/widget?id=1234783462335189080&theme=dark"
      width="350"
      height="600"
      // @ts-expect-error
      allowtransparency="true"
      frameBorder="0"
      sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts"
    ></iframe>
  );
};
