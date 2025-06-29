'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
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

export default function SubscriptionPage() {
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
          <FadeIn>
            <h2>Subscription Plans</h2>
            <p>Loading subscription options...</p>
          </FadeIn>
        </PageHeader>
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <PageHeader>
          <FadeIn>
            <h2>Subscription Plans</h2>
            <p>Error loading subscription data: {error}</p>
          </FadeIn>
        </PageHeader>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader>
        <FadeIn>
          <div className={styles.header__content}>
            <h2>Upgrade Your Plan</h2>
            {fromQuotaLimit ? (
              <p className={styles.quota__message}>
                🚀 You&apos;ve reached your daily limit of{' '}
                {subscriptionData?.currentLimits.free.dailyGenerations}{' '}
                generations. Upgrade to continue creating amazing images!
              </p>
            ) : (
              <p>
                Choose a plan that fits your needs and unlock unlimited
                creativity.
              </p>
            )}
          </div>
        </FadeIn>
      </PageHeader>

      <PageContent>
        <article className={styles.subscription__container}>
          <FadeIn className={styles.subscription__container_fade}>
            {/* Current Plan Limits */}
            <div className={styles.current__plan}>
              <h3>Current Plan: Free</h3>
              <div className={styles.plan__limits}>
                <div className={styles.limit__item}>
                  <span className={styles.limit__label}>
                    Daily Generations:
                  </span>
                  <span className={styles.limit__value}>
                    {subscriptionData?.currentLimits.free.dailyGenerations}
                  </span>
                </div>
                <div className={styles.limit__item}>
                  <span className={styles.limit__label}>Advanced Options:</span>
                  <span className={styles.limit__value}>
                    {subscriptionData?.currentLimits.free.advancedOptions
                      ? 'Enabled'
                      : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Subscription Tier */}
            {subscriptionData && (
              <div className={styles.tier__card}>
                <div className={styles.tier__header}>
                  <h3 className={styles.tier__name}>
                    {subscriptionData.tier.name}
                  </h3>
                  <div className={styles.tier__price}>
                    {subscriptionData.tier.price}
                  </div>
                </div>

                <div className={styles.tier__features}>
                  <h4>What you get:</h4>
                  <ul className={styles.features__list}>
                    {subscriptionData.tier.features.map((feature, index) => (
                      <li key={index} className={styles.feature__item}>
                        ✓ {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className={styles.tier__actions}>
                  <button className={styles.upgrade__button} disabled>
                    Coming Soon - Payment Integration
                  </button>
                  <p className={styles.coming__soon}>
                    Payment processing will be available soon. For now, enjoy
                    your free daily generations!
                  </p>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className={styles.navigation__section}>
              <InstantLink href="/card-generator" className={styles.back__link}>
                ← Back to Card Generator
              </InstantLink>

              {fromQuotaLimit && (
                <div className={styles.quota__info}>
                  <p>
                    Your quota will reset tomorrow. Come back then for more free
                    generations!
                  </p>
                </div>
              )}
            </div>
          </FadeIn>
        </article>
      </PageContent>
    </PageContainer>
  );
}
