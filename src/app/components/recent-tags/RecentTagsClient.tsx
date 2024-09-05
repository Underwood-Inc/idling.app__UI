'use client';
import { useEffect, useState } from 'react';
import { CustomSession } from 'src/auth.config';
import { useShouldUpdate } from 'src/lib/state/ShouldUpdateContext';
import { RECENT_TAGS_SELECTORS } from 'src/lib/test-selectors/components/recent-tags.selectors';
import { Card } from '../card/Card';
import Empty from '../empty/Empty';
import FancyBorder from '../fancy-border/FancyBorder';
import Loader from '../loader/Loader';
import { TagLink } from '../tag-link/TagLink';
import { getRecentTags } from './actions';

export function RecentTagsClient({
  contextId,
  onlyMine,
  initialRecentTags,
  session
}: {
  contextId: string;
  onlyMine: boolean;
  initialRecentTags: { tags: string[] };
  session: CustomSession | null;
}) {
  const [recentTags, setRecentTags] = useState(initialRecentTags);
  const [loading, setLoading] = useState(false);
  const { state: shouldUpdate, dispatch } = useShouldUpdate();

  useEffect(() => {
    async function fetchTags() {
      setLoading(true);
      const tags = await getRecentTags(
        'months',
        onlyMine ? session!.user.providerAccountId : undefined
      );
      setRecentTags(tags);
      setLoading(false);
      dispatch({ type: 'SET_SHOULD_UPDATE', payload: false });
    }

    if (shouldUpdate) {
      fetchTags();
    }
  }, [shouldUpdate, onlyMine, session, dispatch]);

  if (loading) {
    return <RecentTagsLoader />;
  }

  return (
    <article className="recent-tags__article">
      <Card width="full" className="recent-tags__card">
        <FancyBorder className="recent-tags__fancy-border">
          <div className="recent-tags__container">
            <div
              data-testid={RECENT_TAGS_SELECTORS.TITLE}
              className="recent-tags__card-header"
            >
              <h3 title="3 months">Recent Tags</h3>
            </div>

            {recentTags.tags.length > 0 && (
              <ol className="recent-tags__list">
                {recentTags.tags.map((tag) => {
                  return (
                    <li key={tag} className="recent-tags__list-item">
                      <TagLink
                        value={tag}
                        contextId={contextId}
                        appendSearchParam
                      />
                    </li>
                  );
                })}
              </ol>
            )}

            {!recentTags.tags.length && <Empty label="No recent tags" />}
          </div>
        </FancyBorder>
      </Card>
    </article>
  );
}

export function RecentTagsLoader() {
  return (
    <article className="recent-tags__container">
      <Card width="full">
        <FancyBorder className="recent-tags__fancy-border">
          <h3 title="3 months">Recent Tags</h3>
          <Loader label="" color="black" />
        </FancyBorder>
      </Card>
    </article>
  );
}
