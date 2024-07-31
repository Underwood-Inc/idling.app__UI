import React from 'react';
import { GitLabLink } from '../gitlab-link/GitLabLink';
import './FooterNav.css';

const FooterNav = (): React.JSX.Element => {
  return (
    <div className="container">
      <ul className="nav">
        <li>
          <GitLabLink />
        </li>
      </ul>
    </div>
  );
};

export default FooterNav;
