import React from 'react';
import { DiscordLink } from '../discord-link/DiscordLink';
import { DocsLink } from '../docs-link/DocsLink';
import './FooterNav.css';

const FooterNav = (): React.JSX.Element => {
  return (
    <div className="footer-nav__container">
      <ul className="footer-nav__list">
        <li>
          <DocsLink />
        </li>
        <li>
          <DiscordLink />
        </li>
      </ul>
    </div>
  );
};

export default FooterNav;
