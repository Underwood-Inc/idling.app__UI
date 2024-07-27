'use client';
import React from 'react';

export const DiscordEmbed: React.FC = () => {
  return (
    <iframe
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
