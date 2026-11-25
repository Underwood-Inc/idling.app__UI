'use client';

import { useIdlingLocale } from '../locale/IdlingLocaleProvider';
import { UserSearch } from '../user-search/UserSearch';

export function LocalizedUserSearch() {
  const { ll } = useIdlingLocale();
  return <UserSearch placeholder={ll.search.findUsersPlaceholder()} />;
}