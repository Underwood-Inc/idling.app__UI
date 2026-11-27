'use client';

import { OCE } from '@lib/oce';
import { SUBSCRIPTION_EN } from '$i18n-source/subscription.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useIdlingLocale } from '../components/locale/IdlingLocaleProvider';
import FadeIn from '../components/fade-in/FadeIn';
import { PageContainer } from '../components/page-container/PageContainer';
import PageContent from '../components/page-content/PageContent';
import PageHeader from '../components/page-header/PageHeader';
import { InstantLink } from '../components/ui/InstantLink';
import styles from './subscription.module.css';

interface SubscriptionTier {
  name: string;
  price: string;
  features: string[];
  dailyLimit: string;
}

interface SubscriptionData {
  tier: SubscriptionTier;
  message: string;
  paymentUrl: string;
  currentLimits: {
    free: {
      dailyGenerations: number;
      advancedOptions: boolean;
    };
  };
}

function useSubscriptionCopy() {
  const { ll } = useIdlingLocale();
  return useMemo(
    () => resolveCatalogFromLl(SUBSCRIPTION_EN, ll.subscription as Record<string, unknown>),
    [ll]
  );
}

function SubscriptionLoading() {
  const { page: copy } = useSubscriptionCopy();
  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h1>{copy.title}</h1>
          <p>{copy.subtitle}</p>
        </div>
      </PageHeader>
      <PageContent>
        <FadeIn>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>{copy.loading}</p>
          </div>
        </FadeIn>
      </PageContent>
    </PageContainer>
  );
}

// Component that uses useSearchParams - wrapped in Suspense
function SubscriptionContent() {
  const { page: copy } = useSubscriptionCopy();
  const searchParams = useSearchParams();
  const [subscriptionData, setSubscriptionData] =
    useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const tier = searchParams.get('tier') || 'pro';
  const fromQuotaLimit = searchParams.get('from') === 'quota-limit';

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      try {
        setIsLoading(true);
        const response = await OCE.fetch(`/api/subscription?tier=${tier}`);

        if (!response.ok) {
          throw new Error(copy.fetchFailed);
        }

        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : copy.fetchFailed
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscriptionData();
  }, [tier]);

  if (isLoading) {
    return (
      <PageContainer>
        <PageHeader>
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
        </PageHeader>
        <PageContent>
          <FadeIn>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>{copy.loadingData}</p>
            </div>
          </FadeIn>
        </PageContent>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader>
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
        </PageHeader>
        <PageContent>
          <FadeIn>
            <div className={styles.errorContainer}>
              <h2>{copy.errorHeading}</h2>
              <p>{error}</p>
              <InstantLink href="/">{copy.returnHome}</InstantLink>
            </div>
          </FadeIn>
        </PageContent>
      </PageContainer>
    );
  }

  if (!subscriptionData) {
    return (
      <PageContainer>
        <PageHeader>
          <div>
            <h1>{copy.title}</h1>
            <p>{copy.subtitle}</p>
          </div>
        </PageHeader>
        <PageContent>
          <FadeIn>
            <div className={styles.errorContainer}>
              <h2>{copy.noDataHeading}</h2>
              <p>{copy.noDataBody}</p>
              <InstantLink href="/">{copy.returnHome}</InstantLink>
            </div>
          </FadeIn>
        </PageContent>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h1>{copy.title}</h1>
          <p>{fromQuotaLimit ? copy.subtitleQuota : copy.subtitle}</p>
        </div>
      </PageHeader>
      <PageContent>
        <article className={styles.subscriptionArticle}>
          <FadeIn>
            {fromQuotaLimit && (
              <div className={styles.quotaLimitBanner}>
                <h2>{copy.quotaBannerTitle}</h2>
                <p>{copy.quotaBannerBody}</p>
              </div>
            )}

            <div className={styles.subscriptionContent}>
              <div className={styles.subscriptionCard}>
                <div className={styles.cardHeader}>
                  <h2>{subscriptionData.tier.name}</h2>
                  <div className={styles.price}>
                    {subscriptionData.tier.price}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  <h3>{copy.whatYouGet}</h3>
                  <ul className={styles.featuresList}>
                    {subscriptionData.tier.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <div className={styles.limitInfo}>
                    <strong>{copy.dailyLimitLabel}</strong>{' '}
                    {subscriptionData.tier.dailyLimit}
                  </div>

                  <div className={styles.currentLimitsSection}>
                    <h4>{copy.currentLimitsTitle}</h4>
                    <ul>
                      <li>
                        {copy.dailyGenerations}{' '}
                        {subscriptionData.currentLimits.free.dailyGenerations}
                      </li>
                      <li>
                        {copy.advancedOptions}{' '}
                        {subscriptionData.currentLimits.free.advancedOptions
                          ? copy.yes
                          : copy.no}
                      </li>
                    </ul>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <a
                    href={subscriptionData.paymentUrl}
                    className={styles.subscribeButton}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {copy.subscribeNow}
                  </a>
                </div>
              </div>

              <div className={styles.messageSection}>
                <p>{subscriptionData.message}</p>
              </div>

              <div className={styles.backLink}>
                <InstantLink href="/">{copy.backToGenerator}</InstantLink>
              </div>
            </div>
          </FadeIn>
        </article>
      </PageContent>
    </PageContainer>
  );
}

// Main page component with Suspense boundary
export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionLoading />}>
      <SubscriptionContent />
    </Suspense>
  );
}
