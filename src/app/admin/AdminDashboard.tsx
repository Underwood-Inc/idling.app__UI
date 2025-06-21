'use client';

import { useState } from 'react';
import './AdminDashboard.css';
import AdminPostsList from './components/AdminPostsList';
import EmojiApprovalPanel from './components/EmojiApprovalPanel';

type AdminTab = 'emojis' | 'posts' | 'users';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('emojis');

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <h1 className="admin-dashboard__title">Admin Dashboard</h1>
        <div className="admin-dashboard__tabs">
          <button
            className={`admin-dashboard__tab ${activeTab === 'emojis' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => setActiveTab('emojis')}
          >
            Emoji Approval
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'posts' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => setActiveTab('posts')}
          >
            Posts Moderation
          </button>
          <button
            className={`admin-dashboard__tab ${activeTab === 'users' ? 'admin-dashboard__tab--active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
        </div>
      </div>

      <div className="admin-dashboard__content">
        {activeTab === 'emojis' && <EmojiApprovalPanel />}
        {activeTab === 'posts' && <AdminPostsList />}
        {activeTab === 'users' && (
          <div className="admin-dashboard__placeholder">
            <h2>User Management</h2>
            <p>User management features coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
