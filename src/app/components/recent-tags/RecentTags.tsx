import { CustomSession } from 'src/auth.config';
import { auth } from 'src/lib/auth';
import { getRecentTags } from './actions';
import './RecentTags.css';
import { RecentTagsClient } from './RecentTagsClient';

export async function RecentTags({
  contextId,
  onlyMine = false
}: {
  contextId: string;
  onlyMine?: boolean;
}) {
  const session = (await auth()) as CustomSession | null;
  const initialRecentTags = await getRecentTags(
    'months',
    onlyMine && session?.user?.id ? session.user.id : undefined
  );

  return (
    <RecentTagsClient
      contextId={contextId}
      onlyMine={onlyMine}
      initialRecentTags={initialRecentTags}
      session={session}
    />
  );
}
