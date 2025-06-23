'use client';

import { useState } from 'react';
import { CONTEXT_IDS } from '../../../lib/context-ids';
import { SpacingThemeProvider } from '../../../lib/context/SpacingThemeContext';
import PostsManager from '../../components/submissions-list/PostsManager';
import './AdminPostsList.css';
import { AdminSubmissionItem } from './AdminSubmissionItem';

export default function AdminPostsList() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="admin-posts-list">
      <div className="admin-posts-list__header">
        <h2>Posts Moderation</h2>
        <p>
          View and moderate user posts. You can timeout users or take other
          moderation actions.
        </p>
      </div>

      <SpacingThemeProvider>
        <div key={refreshKey} className="admin-posts-list__content">
          <PostsManager
            contextId={CONTEXT_IDS.ADMIN_POSTS.toString()}
            enableThreadMode={true}
            renderSubmissionItem={(props) => (
              <AdminSubmissionItem {...props} onRefresh={handleRefresh} />
            )}
          />
        </div>
      </SpacingThemeProvider>
    </div>
  );
}
