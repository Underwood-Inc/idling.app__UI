'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
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

// Loading component for Suspense fallback
function SubscriptionLoading() {
  return (
    <PageContainer>
      <PageHeader>
        <div>
          <h1>Subscription</h1>
          <p>Choose your plan</p>
        </div>
      </PageHeader>
      <PageContent>
        <FadeIn>
          <div className={styles.loadingContainer}>
            <div className={styles.loadingSpinner}></div>
            <p>Loading subscription options...</p>
          </div>
        </FadeIn>
      </PageContent>
    </PageContainer>
  );
}

// Component that uses useSearchParams - wrapped in Suspense
function SubscriptionContent() {
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
        const response = await fetch(`/api/subscription?tier=${tier}`);

        if (!response.ok) {
          throw new Error('Failed to fetch subscription data');
        }

        const data = await response.json();
        setSubscriptionData(data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load subscription data'
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
            <h1>Subscription</h1>
            <p>Choose your plan</p>
          </div>
        </PageHeader>
        <PageContent>
          <FadeIn>
            <div className={styles.loadingContainer}>
              <div className={styles.loadingSpinner}></div>
              <p>Loading subscription data...</p>
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
            <h1>Subscription</h1>
            <p>Choose your plan</p>
          </div>
        </PageHeader>
        <PageContent>
          <FadeIn>
            <div className={styles.errorContainer}>
              <h2>Error</h2>
              <p>{error}</p>
              <InstantLink href="/">Return to Home</InstantLink>
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
            <h1>Subscription</h1>
            <p>Choose your plan</p>
          </div>
        </PageHeader>
        <PageContent>
          <FadeIn>
            <div className={styles.errorContainer}>
              <h2>No Data Available</h2>
              <p>Subscription data could not be loaded.</p>
              <InstantLink href="/">Return to Home</InstantLink>
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
          <h1>Subscription</h1>
          <p>
            {fromQuotaLimit
              ? 'Upgrade to continue generating emojis'
              : 'Choose your plan'}
          </p>
        </div>
      </PageHeader>
      <PageContent>
        <article className={styles.subscriptionArticle}>
          <FadeIn>
            {fromQuotaLimit && (
              <div className={styles.quotaLimitBanner}>
                <h2>Daily Limit Reached</h2>
                <p>
                  You&apos;ve reached your daily generation limit. Upgrade to
                  Pro to continue generating emojis with unlimited daily
                  generations.
                </p>
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
                  <h3>What you get:</h3>
                  <ul className={styles.featuresList}>
                    {subscriptionData.tier.features.map((feature, index) => (
                      <li key={index}>{feature}</li>
                    ))}
                  </ul>

                  <div className={styles.limitInfo}>
                    <strong>Daily Limit:</strong>{' '}
                    {subscriptionData.tier.dailyLimit}
                  </div>

                  <div className={styles.currentLimitsSection}>
                    <h4>Your Current Limits (Free Plan):</h4>
                    <ul>
                      <li>
                        Daily Generations:{' '}
                        {subscriptionData.currentLimits.free.dailyGenerations}
                      </li>
                      <li>
                        Advanced Options:{' '}
                        {subscriptionData.currentLimits.free.advancedOptions
                          ? 'Yes'
                          : 'No'}
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
                    Subscribe Now
                  </a>
                </div>
              </div>

              <div className={styles.messageSection}>
                <p>{subscriptionData.message}</p>
              </div>

              <div className={styles.backLink}>
                <InstantLink href="/">← Back to Emoji Generator</InstantLink>
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
