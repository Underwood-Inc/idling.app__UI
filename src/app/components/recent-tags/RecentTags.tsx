import { CustomSession } from 'src/auth.config';
import { auth } from 'src/lib/auth';
import { Card } from '../card/Card';
import Empty from '../empty/Empty';
import FancyBorder from '../fancy-border/FancyBorder';
import Loader from '../loader/Loader';
import { TagLink } from '../tag-link/TagLink';
import { getRecentTags } from './actions';
import './RecentTags.css';

export async function RecentTags({ onlyMine = false }: { onlyMine?: boolean }) {
  const session = (await auth()) as CustomSession | null;
  const recentTags = await getRecentTags(
    'months',
    onlyMine ? session!.user.providerAccountId : undefined
  );

  return (
    <article className="recent-tags__container">
      <Card width="full">
        <FancyBorder>
          <h3 title="3 months">Recent Tags</h3>

          {recentTags.tags.length > 0 && (
            <ol className="recent-tags__list">
              {recentTags.tags.map((tag) => {
                return (
                  <li key={tag} className="recent-tags__list-item">
                    <TagLink value={tag} appendSearchParam />
                  </li>
                );
              })}
            </ol>
          )}

          {!recentTags.tags.length && <Empty label="No recent tags" />}
        </FancyBorder>
      </Card>
    </article>
  );
}

export function RecentTagsLoader() {
  return (
    <article className="recent-tags__container">
      <Card width="full">
        <FancyBorder>
          <h3>Recent Tags (3 months)</h3>
          <Loader label="" color="black" />
        </FancyBorder>
      </Card>
    </article>
  );
}
