import React from 'react';
import AppVersion from '../app-version/AppVersion';
import CacheStatus from '../cache-status/CacheStatus';
import FooterNav from '../footer-nav/FooterNav';
import './Footer.css';

const Footer = (): React.JSX.Element => {
  return (
    <footer className="footer">
      <CacheStatus />

      <AppVersion className="footer__app-version" />

      <FooterNav />
    </footer>
  );
};

export default Footer;
