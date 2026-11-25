'use client';

import { NAV_PATHS } from '@lib/routes';
import { ABOUT_PAGE_SELECTORS } from '@lib/test-selectors/pages/about.selectors';
import type { AboutSectionIconId } from '@molecules/lucide/siteIconCatalog';
import { PORTFOLIO_EN } from '$i18n-source/portfolio.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { LinkTooltip } from '../tooltip/LinkTooltip';
import { InstantLink } from '../ui/InstantLink';
import { AboutExternalLink } from './AboutExternalLink';
import { AboutSectionTitle } from './AboutSectionTitle';
import './About.css';

export function About() {
  const { ll } = useIdlingLocale();
  const portfolio = resolveCatalogFromLl(PORTFOLIO_EN, ll.portfolio as Record<string, unknown>);
  const about = portfolio.about;

  return (
    <div className="about">
      <div className="about__hero">
        <p className="about__eyebrow">{about.eyebrow}</p>
        <h2 className="about__title">{about.title}</h2>
        <p className="about__tagline">{about.tagline}</p>
        <p className="about__intro">
          <LinkTooltip url={NAV_PATHS.ROOT} isInsideParagraph>
            {/* eslint-disable-next-line custom-rules/enforce-link-target-blank */}
            <InstantLink
              data-testid={ABOUT_PAGE_SELECTORS.ROOT_LINK}
              href={NAV_PATHS.ROOT}
            >
              idling.app
            </InstantLink>
          </LinkTooltip>{' '}
          {about.introAfterLink}
        </p>

        <ul className="about__stats" aria-label={about.statsAria}>
          {about.highlights.map((item) => (
            <li key={item.label} className="about__stat">
              <span className="about__stat-value">{item.value}</span>
              <span className="about__stat-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="about__sections">
        {about.sections.map((section) => (
          <div key={section.id} className="about__section">
            <AboutSectionTitle
              sectionId={section.id as AboutSectionIconId}
              title={section.title}
            />
            <ul className="about__highlights">
              {section.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
            {section.links && section.links.length > 0 && (
              <div className="about__section-links">
                {section.links.map((link) => (
                  <AboutExternalLink key={link.href} href={link.href} label={link.label} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}