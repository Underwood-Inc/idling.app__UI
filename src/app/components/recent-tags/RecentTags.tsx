import { Card } from '../card/Card';
import Empty from '../empty/Empty';
import FancyBorder from '../fancy-border/FancyBorder';
import Loader from '../loader/Loader';
import { TagLink } from '../tag-link/TagLink';
import { getRecentTags } from './actions';
import './RecentTags.css';

export async function RecentTags() {
  const recentTags = await getRecentTags();

  return (
    <article className="recent-tags__container">
      <Card width="full">
        <FancyBorder>
          <h4>Recent Tags (3 months)</h4>

          {recentTags.tags && (
            <ol className="recent-tags__list">
              {recentTags.tags.map((tag) => {
                return (
                  <li key={tag} className="recent-tags__list-item">
                    <TagLink value={tag} />
                  </li>
                );
              })}
            </ol>
          )}

          {!recentTags.tags && <Empty />}
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
          <h4>Recent Tags (3 months)</h4>
          <Loader label="" color="black" />
        </FancyBorder>
      </Card>
    </article>
  );
}
