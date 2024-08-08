import { Card } from '../card/Card';
import { getRecentTags } from './actions';

export async function RecentTags() {
  const recentTags = await getRecentTags();

  return (
    <article className="recent-tags__container">
      <Card>
        <h4>tags</h4>

        {recentTags.tags && (
          <ol>
            {recentTags.tags.map((tag) => {
              return <li key={tag}>{tag}</li>;
            })}
          </ol>
        )}
      </Card>
    </article>
  );
}
