import React from 'react';
import { AdUnit } from '../ad-unit';
import AppVersion from '../app-version/AppVersion';
import SmartCacheStatus from '../cache-status/SmartCacheStatus';
import FooterNav from '../footer-nav/FooterNav';
import { LocalePicker } from '../locale/LocalePicker';
import './Footer.scss';

const Footer = (): React.JSX.Element => {
  return (
    <div className="footer-wrapper">
      {/* Footer Advertisement Section */}
      <div className="footer-ad-section">
        <AdUnit className="ad-unit--footer" testId="footer-ad" />
      </div>

      <footer className="footer">
        <div className="footer__leading">
          <SmartCacheStatus />
          <LocalePicker />
        </div>

        <div className="footer__center">
          <FooterNav />
        </div>

        <AppVersion className="footer__app-version" />
      </footer>
    </div>
  );
};

export default Footer;
