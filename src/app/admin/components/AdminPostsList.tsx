'use client';

import { CONTEXT_IDS } from '../../../lib/context-ids';
import PostsManager from '../../components/submissions-list/PostsManager';
import './AdminPostsList.css';

export default function AdminPostsList() {
  return (
    <div className="admin-posts-list">
      <h3>Recent Posts</h3>
      <PostsManager contextId={CONTEXT_IDS.ADMIN_POSTS.toString()} />
    </div>
  );
}
