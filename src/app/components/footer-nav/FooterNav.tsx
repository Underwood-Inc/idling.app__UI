import React from 'react';
import { DiscordLink } from '../discord-link/DiscordLink';
import './FooterNav.css';

const FooterNav = (): React.JSX.Element => {
  return (
    <div className="footer-nav__container">
      <ul className="footer-nav__list">
        <li>
          <DiscordLink />
        </li>
      </ul>
    </div>
  );
};

export default FooterNav;
