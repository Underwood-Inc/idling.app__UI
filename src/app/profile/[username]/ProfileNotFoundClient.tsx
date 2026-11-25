'use client';

import { PROFILE_EN } from '$i18n-source/profile.en';
import { COMMON_EN } from '$i18n-source/common.en';
import { resolveCatalogFromLl } from '@molecules/i18n/resolveEnCatalog';
import { SiteIcon } from '@molecules/lucide/SiteIcon';
import { Card } from '../../components/card/Card';
import FadeIn from '../../components/fade-in/FadeIn';
import { useIdlingLocale } from '../../components/locale/IdlingLocaleProvider';
import { PageAside } from '../../components/page-aside/PageAside';
import { PageContainer } from '../../components/page-container/PageContainer';
import PageContent from '../../components/page-content/PageContent';
import { UserSearch } from '../../components/user-search/UserSearch';

export function ProfileNotFoundClient() {
  const { ll } = useIdlingLocale();
  const profile = resolveCatalogFromLl(PROFILE_EN, ll.profile as Record<string, unknown>);
  const common = resolveCatalogFromLl(COMMON_EN, ll.common as Record<string, unknown>);
  const copy = profile.notFound;

  return (
    <PageContainer>
      <PageContent>
        <FadeIn>
          <Card width="full" className="user-not-found-main">
            <div className="user-not-found">
              <div className="user-not-found__icon" aria-label={copy.iconAria}>
                <SiteIcon id="userSearch" sizeRem={3} />
              </div>

              <h1 className="user-not-found__title">{copy.title}</h1>

              <p className="user-not-found__message">{copy.message}</p>

              <ul className="user-not-found__reasons">
                {copy.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <div className="user-not-found__actions">
                <a href="/" className="user-not-found__action user-not-found__action--primary">
                  {common.actions.goHome}
                </a>
              </div>

              <div className="user-not-found__search-section">
                <h3 className="user-not-found__search-title">
                  <SiteIcon id="search" className="user-not-found__search-title-icon" sizeRem={1.125} />
                  {copy.searchTitle}
                </h3>
                <p className="user-not-found__search-description">{copy.searchDescription}</p>
                <UserSearch placeholder={copy.searchPlaceholder} className="user-not-found__search" />
              </div>
            </div>
          </Card>
        </FadeIn>
      </PageContent>

      <PageAside>
        <FadeIn>
          <Card width="full" className="user-not-found-aside">
            <h3 className="user-not-found-help-title">{copy.helpTitle}</h3>
            <div className="user-not-found__help">
              <div className="user-not-found__help-item">
                <SiteIcon id="search" className="user-not-found__help-icon" sizeRem={1.125} />
                <div className="user-not-found__help-content">
                  <span className="user-not-found__help-label">{copy.helpSearchLabel}</span>
                  <span className="user-not-found__help-description">{copy.helpSearchDescription}</span>
                </div>
              </div>

              <div className="user-not-found__help-item">
                <SiteIcon id="users" className="user-not-found__help-icon" sizeRem={1.125} />
                <div className="user-not-found__help-content">
                  <span className="user-not-found__help-label">{copy.helpProductsLabel}</span>
                  <span className="user-not-found__help-description">{copy.helpProductsDescription}</span>
                </div>
              </div>
            </div>
          </Card>
        </FadeIn>
      </PageAside>
    </PageContainer>
  );
}