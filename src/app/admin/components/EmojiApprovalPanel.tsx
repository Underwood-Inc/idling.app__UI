'use client';

import { useEffect, useState } from 'react';
import './EmojiApprovalPanel.css';

interface CustomEmoji {
  id: number;
  name: string;
  encrypted_image_data: string;
  created_by: number;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  is_globally_available: boolean;
  creator_username?: string;
  reviewer_username?: string;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default function EmojiApprovalPanel() {
  const [emojis, setEmojis] = useState<CustomEmoji[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    'pending' | 'approved' | 'rejected'
  >('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Fetch emojis
  const fetchEmojis = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '10',
        search: searchTerm
      });

      const response = await fetch(`/api/admin/emojis?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmojis(data.emojis);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching emojis:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmojis(currentPage);
  }, [statusFilter, currentPage]);

  // Handle search
  const handleSearch = () => {
    setCurrentPage(1);
    fetchEmojis(1);
  };

  // Handle emoji approval/rejection
  const handleEmojiAction = async (
    emojiId: number,
    action: 'approve' | 'reject',
    notes?: string,
    isGloballyAvailable?: boolean
  ) => {
    try {
      const response = await fetch('/api/admin/emojis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emojiId,
          action,
          notes,
          isGloballyAvailable
        })
      });

      if (response.ok) {
        fetchEmojis(currentPage); // Refresh the list
      } else {
        console.error('Failed to update emoji');
      }
    } catch (error) {
      console.error('Error updating emoji:', error);
    }
  };

  return (
    <div className="emoji-approval-panel">
      <div className="emoji-approval-panel__header">
        <h2>Emoji Approval</h2>

        <div className="emoji-approval-panel__controls">
          <div className="emoji-approval-panel__filter">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value as 'pending' | 'approved' | 'rejected'
                )
              }
            >
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="emoji-approval-panel__search">
            <input
              type="text"
              placeholder="Search emojis or users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="emoji-approval-panel__loading">Loading emojis...</div>
      ) : (
        <>
          <div className="emoji-approval-panel__list">
            {emojis.length === 0 ? (
              <div className="emoji-approval-panel__empty">
                No emojis found for the current filter.
              </div>
            ) : (
              emojis.map((emoji) => (
                <div key={emoji.id} className="emoji-card">
                  <div className="emoji-card__info">
                    <div className="emoji-card__name">:{emoji.name}:</div>
                    <div className="emoji-card__meta">
                      <span>By: {emoji.creator_username}</span>
                      <span>
                        Created:{' '}
                        {new Date(emoji.created_at).toLocaleDateString()}
                      </span>
                      <span
                        className={`emoji-card__status emoji-card__status--${emoji.approval_status}`}
                      >
                        {emoji.approval_status.toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <div className="emoji-card__actions">
                    {emoji.approval_status === 'pending' && (
                      <>
                        <button
                          className="emoji-card__action-btn emoji-card__action-btn--approve"
                          onClick={() => handleEmojiAction(emoji.id, 'approve')}
                        >
                          Approve
                        </button>
                        <button
                          className="emoji-card__action-btn emoji-card__action-btn--reject"
                          onClick={() => handleEmojiAction(emoji.id, 'reject')}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="emoji-approval-panel__pagination">
              <button
                disabled={!pagination.hasPrev}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <button
                disabled={!pagination.hasNext}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
