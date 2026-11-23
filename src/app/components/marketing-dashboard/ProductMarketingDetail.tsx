'use client';

import { LucideIcon } from '@molecules/lucide/LucideIcon';
import Image from 'next/image';
import Link from 'next/link';
import FadeIn from '../fade-in/FadeIn';
import PageContent from '../page-content/PageContent';
import type { ProjectShowcaseProject } from '../project-showcase/projectShowcaseProjects';
import { ProductTechStack } from '../../strixun-stream-suite/ProductTechStack';
import { productTechStackItems } from '../../strixun-stream-suite/productTechStackCatalog';
import {
  getHomeHubContentEntry,
  listProductMarketingBuiltWithLabels,
  listProductMarketingHighlightsForProject,
} from './homeHubContent';
import { ProductModrinthStats } from './ProductModrinthStats';
import {
  getProductMarketingTourHref,
  listProductMarketingLinks,
  productMarketingStatusLabel,
  productMarketingTagline,
} from './productMarketing';
import '../../strixun-stream-suite/product-detail.css';

export interface ProductMarketingDetailProps {
  project: ProjectShowcaseProject;
}

export function ProductMarketingDetail({ project }: ProductMarketingDetailProps) {
  const status = productMarketingStatusLabel(project.status);
  const links = listProductMarketingLinks(project.links);
  const tourHref = getProductMarketingTourHref(project);
  const tagline = productMarketingTagline(project);
  const hubVisual = getHomeHubContentEntry(project.id)?.visual;
  const visualFit = hubVisual?.fit ?? 'cover';
  const explainedHighlights = listProductMarketingHighlightsForProject(project);
  const builtWithLabels = listProductMarketingBuiltWithLabels(project.id);
  const builtWithItems = productTechStackItems(builtWithLabels);

  return (
    <PageContent>
      <div className="detail__showcase" data-testid="product-detail">
        <FadeIn>
          <Link href="/" className="product-marketing-back">
            ← Back home
          </Link>

          <div className="product-hero">
            {hubVisual ? (
              <div className="product-hero__visual">
                <Image
                  src={hubVisual.src}
                  alt={hubVisual.alt}
                  fill
                  sizes="(max-width: 640px) 42vw, 12rem"
                  className={
                    visualFit === 'contain'
                      ? 'product-hero__visualImg product-hero__visualImg--contain'
                      : 'product-hero__visualImg'
                  }
                  unoptimized={
                    hubVisual.src.endsWith('.gif') ||
                    hubVisual.src.endsWith('.webp') ||
                    hubVisual.src.endsWith('.svg') ||
                    hubVisual.src.endsWith('.jpg') ||
                    hubVisual.src.endsWith('.jpeg')
                  }
                />
              </div>
            ) : (
              <div className="product-hero__icon product-hero__icon--lucide" aria-hidden="true">
                <LucideIcon icon={project.icon} sizeRem={1} />
              </div>
            )}
            <p className="product-marketing-meta">
              {project.category}
              <span aria-hidden="true"> · </span>
              {project.type}
              {status ? (
                <>
                  <span aria-hidden="true"> · </span>
                  {status}
                </>
              ) : null}
            </p>
            <h1 className="product-hero__title">{project.title}</h1>
            <p className="product-hero__tagline product-hero__tagline--marketing">{tagline}</p>
            <div className="product-hero__actions">
              {links.map((link, index) => {
                const className = `product-hero__cta ${
                  index === 0 ? 'product-hero__cta--primary' : 'product-hero__cta--secondary'
                }`;

                if (link.external) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      className={className}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {link.label} →
                    </a>
                  );
                }

                return (
                  <Link key={link.href} href={link.href} className={className}>
                    {link.label} →
                  </Link>
                );
              })}
            </div>
            {project.modrinthId ? (
              <div className="product-marketing-metrics">
                <ProductModrinthStats projectId={project.id} />
              </div>
            ) : null}
          </div>

          <div className="product-section">
            <h2 className="product-section__title">What you get</h2>
            <p className="product-section__description">{project.description}</p>
            {project.modrinthMetricsNote ? (
              <p className="product-marketing-note">{project.modrinthMetricsNote}</p>
            ) : null}
          </div>

          <div className="product-section product-section--explained">
            <h2 className="product-section__title">What it does</h2>
            <p className="product-section__lede">
              Concrete capabilities — not a feature bingo card. Each item is something you can try
              in the app or on the linked tour.
            </p>
            <div className="product-marketing-highlights">
              {explainedHighlights.map((item) => (
                <article key={item.title} className="product-marketing-highlight">
                  <h3 className="product-marketing-highlight__title">{item.title}</h3>
                  <p className="product-marketing-highlight__body">{item.body}</p>
                </article>
              ))}
            </div>
          </div>

          {builtWithItems.length > 0 ? (
            <div className="product-section">
              <h2 className="product-section__title">Built With</h2>
              <ProductTechStack items={builtWithItems} />
            </div>
          ) : null}

          {tourHref ? (
            <div className="product-section product-marketing-tour">
              <h2 className="product-section__title">Product tour</h2>
              <p className="product-section__description">
                This product has a dedicated walkthrough with extra architecture notes and launch
                links on its tour page.
              </p>
              <Link href={tourHref} className="product-hero__cta product-hero__cta--secondary">
                Open product tour →
              </Link>
            </div>
          ) : null}

        </FadeIn>
      </div>
    </PageContent>
  );
}