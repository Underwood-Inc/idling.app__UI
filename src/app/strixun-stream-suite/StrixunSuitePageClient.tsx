'use client';

import { SiteIcon } from '@molecules/lucide/SiteIcon';
import {
  resolveStrixunSuiteProduct,
  resolveSuiteLandingCopy,
} from '@molecules/i18n/idlingSuiteI18n';
import Link from 'next/link';
import { useMemo } from 'react';
import FadeIn from '../components/fade-in/FadeIn';
import { useIdlingLocale } from '../components/locale/IdlingLocaleProvider';
import styles from './page.module.css';
import {
  STRIXUN_SUITE_PRODUCT_COPY_EN,
  STRIXUN_SUITE_PRODUCTS,
} from './strixunSuiteProducts';

export function StrixunSuitePageClient() {
  const { ll } = useIdlingLocale();
  const landing = useMemo(() => resolveSuiteLandingCopy(ll), [ll]);
  const products = useMemo(
    () =>
      STRIXUN_SUITE_PRODUCTS.map((structure) =>
        resolveStrixunSuiteProduct(
          structure,
          STRIXUN_SUITE_PRODUCT_COPY_EN[structure.id],
          ll
        )
      ),
    [ll]
  );

  return (
    <div className={styles.showcase}>
      <FadeIn>
        <section className={styles.hero}>
          <div className={styles.hero__content}>
            <img
              src="/red_panda/animated/256x256/extra/HI.gif"
              alt="Red Panda Mascot"
              className={styles.hero__mascot}
            />
            <h1 className={styles.hero__title}>{landing.hero.title}</h1>
            <p className={styles.hero__tagline}>{landing.hero.tagline}</p>
            <p className={styles.hero__description}>
              {landing.hero.description}
              <strong>{landing.hero.descriptionEmphasis}</strong>
            </p>
            <div className={styles.hero__actions}>
              <a
                href="https://github.com/Underwood-Inc/strixun-stream-suite"
                className={`${styles.cta__primary} contrast-safe-surface contrast-safe-surface--cta-primary`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className={styles.cta__icon}>
                  <SiteIcon id="folderGit" sizeRem={1.125} />
                </span>
                {landing.hero.viewOnGitHub}
              </a>
            </div>
          </div>
        </section>

        {products.map((product, index) => (
          <section
            key={product.id}
            className={`${styles.product} ${index % 2 === 0 ? styles.product__left : styles.product__right}`}
          >
            <div className={styles.product__visual}>
              {product.image ? (
                <img src={product.image} alt={product.name} className={styles.product__image} />
              ) : (
                <span className={styles.product__icon}>{product.icon}</span>
              )}
              <div className={styles.product__stats}>
                {product.highlights.map((highlight, i) => (
                  <div key={i} className={styles.stat}>
                    <span className={styles.stat__value}>{highlight.value}</span>
                    <span className={styles.stat__label}>{highlight.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.product__content}>
              <div className={styles.product__header}>
                <div>
                  <h2 className={styles.product__name}>{product.name}</h2>
                  <p className={styles.product__tagline}>{product.tagline}</p>
                </div>
                <span className={`${styles.badge} ${styles[`badge__${product.status}`]}`}>
                  {landing.status[product.status]}
                </span>
              </div>

              <p className={styles.product__description}>{product.description}</p>

              <ul className={styles.product__features}>
                {product.keyFeatures.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>

              <div className={styles.product__actions}>
                <a
                  href={product.url}
                  className={styles.cta__secondary}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {landing.productActions.launchApp}
                </a>
                {product.detailsPath ? (
                  <Link href={product.detailsPath} className={styles.cta__tertiary}>
                    {landing.productActions.learnMore}
                  </Link>
                ) : null}
              </div>
            </div>
          </section>
        ))}

        <section className={styles.footer}>
          <div className={styles.footer__content}>
            <h2 className={styles.footer__title}>{landing.footer.title}</h2>
            <p className={styles.footer__description}>{landing.footer.description}</p>
            <a
              href="https://github.com/Underwood-Inc/strixun-stream-suite"
              className={`${styles.cta__primary} contrast-safe-surface contrast-safe-surface--cta-primary`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <span className={styles.cta__icon}>
                <SiteIcon id="star" sizeRem={1.125} />
              </span>
              {landing.footer.starOnGitHub}
            </a>
          </div>
        </section>
      </FadeIn>
    </div>
  );
}