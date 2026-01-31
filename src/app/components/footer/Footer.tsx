import React from 'react';
import { AdUnit } from '../ad-unit';
import AppVersion from '../app-version/AppVersion';
import SmartCacheStatus from '../cache-status/SmartCacheStatus';
import FooterNav from '../footer-nav/FooterNav';
import './Footer.scss';

const Footer = (): React.JSX.Element => {
  return (
    <div className="footer-wrapper">
      {/* Footer Advertisement Section */}
      <div className="footer-ad-section">
        <AdUnit className="ad-unit--footer" testId="footer-ad" />
      </div>

      <footer className="footer">
        <SmartCacheStatus />

        <AppVersion className="footer__app-version" />

        <FooterNav />
      </footer>
    </div>
  );
};

export default Footer;
