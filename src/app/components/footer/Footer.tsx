import React from 'react';
import AppVersion from '../app-version/AppVersion';
import SmartCacheStatus from '../cache-status/SmartCacheStatus';
import FooterNav from '../footer-nav/FooterNav';
import './Footer.scss';

const Footer = (): React.JSX.Element => {
  return (
    <footer className="footer">
      <SmartCacheStatus />

      <AppVersion className="footer__app-version" />

      <FooterNav />
    </footer>
  );
};

export default Footer;
