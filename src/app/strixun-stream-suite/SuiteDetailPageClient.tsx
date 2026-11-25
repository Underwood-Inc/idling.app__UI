'use client';

import { SUITE_DETAILS_EN, type SuiteDetailEnCopy, type SuiteDetailProductId } from '$i18n-source/suiteDetails.en';
import { FeatureIcon } from '@molecules/lucide/FeatureIcon';
import type { SiteIconId } from '@molecules/lucide/siteIconCatalog';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useMemo } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { useIdlingLocale } from '../components/locale/IdlingLocaleProvider';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import { ProductTechStack } from './ProductTechStack';
import { productTechStackItems } from './productTechStackCatalog';
import './product-detail.css';

export interface SuiteDetailPageClientLinks {
  launchHref: string;
  sourceHref: string;
  mascotSrc: string;
}

export interface SuiteDetailPageClientIconLayout {
  keyFeatures: SiteIconId[];
  extraSections?: SiteIconId[][];
}

export interface SuiteDetailPageClientProps {
  productId: SuiteDetailProductId;
  builtWith: readonly string[];
  links: SuiteDetailPageClientLinks;
  icons: SuiteDetailPageClientIconLayout;
}

function ProductFeatureSection({
  section,
  featureIcons,
}: {
  section: SuiteDetailEnCopy['keyFeatures'];
  featureIcons: SiteIconId[];
}) {
  return (
    <div className="product-section">
      <h2 className="product-section__title">{section.title}</h2>
      {section.description ? (
        <p className="product-section__description">{section.description}</p>
      ) : null}
      <div className="product-features">
        {section.features.map((feature, index) => (
          <div key={feature.title} className="product-feature">
            <div className="product-feature__icon">
              <FeatureIcon iconId={featureIcons[index] ?? 'sparkles'} sizeRem={5} />
            </div>
            <h3 className="product-feature__title">{feature.title}</h3>
            <p className="product-feature__description">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuiteDetailPageClient({
  productId,
  builtWith,
  links,
  icons,
}: SuiteDetailPageClientProps) {
  const { ll } = useIdlingLocale();
  const copy = useMemo((): SuiteDetailEnCopy => {
    const suite = ll.suite as { details?: Record<string, unknown> };
    const localized = suite.details?.[productId] as Record<string, unknown> | undefined;
    return resolveCatalogFromLl(SUITE_DETAILS_EN[productId], localized);
  }, [ll, productId]);

  return (
    <PageContainer>
      <PageContent>
        <div className="detail__showcase">
          <FadeIn>
            <div className="product-hero">
              <img
                src={links.mascotSrc}
                alt={copy.hero.mascotAlt}
                className="product-hero__mascot"
                width={256}
                height={256}
              />
              <h1 className="product-hero__title">{copy.hero.title}</h1>
              <p className="product-hero__tagline">{copy.hero.tagline}</p>
              {copy.hero.statusBeta ? (
                <p className="product-hero__status product-hero__status--beta" role="status">
                  {copy.hero.statusBeta}
                </p>
              ) : null}
              <div className="product-hero__actions">
                <a
                  href={links.launchHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-hero__cta product-hero__cta--primary"
                >
                  {copy.hero.ctaLaunch}
                </a>
                <a
                  href={links.sourceHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="product-hero__cta product-hero__cta--secondary"
                >
                  {copy.hero.ctaViewSource}
                </a>
              </div>
              <div className="product-hero__scroll-indicator">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                <span className="sr-only">{copy.a11y.scrollForMore}</span>
              </div>
            </div>

            <div className="product-section">
              <h2 className="product-section__title">{copy.overview.title}</h2>
              <p className="product-section__description">{copy.overview.description}</p>
            </div>

            <ProductFeatureSection section={copy.keyFeatures} featureIcons={icons.keyFeatures} />

            {copy.extraSections?.map((section, sectionIndex) => (
              <ProductFeatureSection
                key={section.title}
                section={section}
                featureIcons={icons.extraSections?.[sectionIndex] ?? []}
              />
            ))}

            <div className="product-section">
              <h2 className="product-section__title">{copy.builtWith.title}</h2>
              <ProductTechStack items={productTechStackItems([...builtWith])} />
            </div>
          </FadeIn>
        </div>
      </PageContent>
    </PageContainer>
  );
}