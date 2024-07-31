import React from 'react';
import { GitLabLink } from '../gitlab-link/GitLabLink';
import './FooterNav.css';

const FooterNav = (): React.JSX.Element => {
  return (
    <div className="footer-nav__container">
      <ul className="footer-nav__list">
        <li>
          <GitLabLink />
        </li>
      </ul>
    </div>
  );
};

export default FooterNav;
