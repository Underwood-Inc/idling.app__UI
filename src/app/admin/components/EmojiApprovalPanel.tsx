'use client';

import { useEffect, useState } from 'react';
import './EmojiApprovalPanel.css';

interface CustomEmoji {
  id: number;
  name: string;
  description: string;
  encrypted_image_data: string;
  category: string;
  user_id: number;
  created_at: string;
  creator_email: string;
  image_data: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected';
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  is_globally_available?: boolean;
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
    'all' | 'pending' | 'approved' | 'rejected'
  >('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmojis, setSelectedEmojis] = useState<Set<number>>(new Set());
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectingEmojiId, setRejectingEmojiId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch emojis
  const fetchEmojis = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        status: statusFilter,
        page: page.toString(),
        limit: '20',
        search: searchTerm
      });

      const response = await fetch(`/api/admin/emojis?${params}`);
      if (response.ok) {
        const data = await response.json();
        setEmojis(data.emojis || []);
        setPagination(data.pagination);
      } else {
        console.error('Failed to fetch emojis:', response.statusText);
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

  // Handle emoji approval
  const handleApproveEmoji = async (emojiId: number) => {
    try {
      const response = await fetch('/api/admin/emojis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emojiId,
          action: 'approve'
        })
      });

      if (response.ok) {
        fetchEmojis(currentPage);
      } else {
        console.error('Failed to approve emoji');
      }
    } catch (error) {
      console.error('Error approving emoji:', error);
    }
  };

  // Handle emoji rejection
  const handleRejectEmoji = async (emojiId: number, reason: string) => {
    try {
      const response = await fetch('/api/admin/emojis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emojiId,
          action: 'reject',
          reason
        })
      });

      if (response.ok) {
        fetchEmojis(currentPage);
        setShowRejectModal(false);
        setRejectReason('');
        setRejectingEmojiId(null);
      } else {
        console.error('Failed to reject emoji');
      }
    } catch (error) {
      console.error('Error rejecting emoji:', error);
    }
  };

  // Handle emoji deletion
  const handleDeleteEmoji = async (
    emojiId: number,
    reason: string = 'Deleted by admin'
  ) => {
    if (!confirm('Are you sure you want to permanently delete this emoji?')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/emojis?id=${emojiId}&reason=${encodeURIComponent(reason)}`,
        {
          method: 'DELETE'
        }
      );

      if (response.ok) {
        fetchEmojis(currentPage);
      } else {
        console.error('Failed to delete emoji');
      }
    } catch (error) {
      console.error('Error deleting emoji:', error);
    }
  };

  // Handle bulk approval
  const handleBulkApprove = async () => {
    if (selectedEmojis.size === 0) return;

    for (const emojiId of selectedEmojis) {
      await handleApproveEmoji(emojiId);
    }
    setSelectedEmojis(new Set());
  };

  // Handle emoji selection
  const toggleEmojiSelection = (emojiId: number) => {
    const newSelected = new Set(selectedEmojis);
    if (newSelected.has(emojiId)) {
      newSelected.delete(emojiId);
    } else {
      newSelected.add(emojiId);
    }
    setSelectedEmojis(newSelected);
  };

  // Select all emojis
  const selectAllEmojis = () => {
    if (selectedEmojis.size === emojis.length) {
      setSelectedEmojis(new Set());
    } else {
      setSelectedEmojis(new Set(emojis.map((e) => e.id)));
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string = 'pending') => {
    switch (status) {
      case 'approved':
        return 'emoji-card__status--approved';
      case 'rejected':
        return 'emoji-card__status--rejected';
      default:
        return 'emoji-card__status--pending';
    }
  };

  return (
    <div className="emoji-approval-panel">
      <div className="emoji-approval-panel__header">
        <h2>Emoji Management</h2>

        <div className="emoji-approval-panel__controls">
          <div className="emoji-approval-panel__filter">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div className="emoji-approval-panel__search">
            <input
              type="text"
              placeholder="Search emojis, users, or categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button onClick={handleSearch}>Search</button>
          </div>

          {selectedEmojis.size > 0 && (
            <div className="emoji-approval-panel__bulk-actions">
              <span>{selectedEmojis.size} selected</span>
              <button
                onClick={handleBulkApprove}
                className="emoji-approval-panel__bulk-btn emoji-approval-panel__bulk-btn--approve"
              >
                Bulk Approve
              </button>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="emoji-approval-panel__loading">Loading emojis...</div>
      ) : (
        <>
          {emojis.length > 0 && (
            <div className="emoji-approval-panel__actions">
              <label className="emoji-approval-panel__select-all">
                <input
                  type="checkbox"
                  checked={
                    selectedEmojis.size === emojis.length && emojis.length > 0
                  }
                  onChange={selectAllEmojis}
                />
                Select All ({emojis.length})
              </label>
            </div>
          )}

          <div className="emoji-approval-panel__list">
            {emojis.length === 0 ? (
              <div className="emoji-approval-panel__empty">
                No emojis found for the current filter.
              </div>
            ) : (
              emojis.map((emoji) => (
                <div key={emoji.id} className="emoji-card">
                  <div className="emoji-card__checkbox">
                    <input
                      type="checkbox"
                      checked={selectedEmojis.has(emoji.id)}
                      onChange={() => toggleEmojiSelection(emoji.id)}
                    />
                  </div>

                  <div className="emoji-card__image">
                    {emoji.image_data ? (
                      <img
                        src={`data:image/png;base64,${emoji.image_data}`}
                        alt={emoji.name}
                        width="48"
                        height="48"
                      />
                    ) : (
                      <div className="emoji-card__placeholder">No Image</div>
                    )}
                  </div>

                  <div className="emoji-card__info">
                    <div className="emoji-card__name">:{emoji.name}:</div>
                    <div className="emoji-card__meta">
                      <span>By: {emoji.creator_email}</span>
                      <span>Category: {emoji.category}</span>
                      <span>Created: {formatDate(emoji.created_at)}</span>
                      {emoji.description && (
                        <span>Description: {emoji.description}</span>
                      )}
                    </div>
                    <span
                      className={`emoji-card__status ${getStatusBadgeClass(emoji.approval_status)}`}
                    >
                      {(emoji.approval_status || 'pending').toUpperCase()}
                    </span>
                  </div>

                  <div className="emoji-card__actions">
                    {(!emoji.approval_status ||
                      emoji.approval_status === 'pending') && (
                      <>
                        <button
                          className="emoji-card__action-btn emoji-card__action-btn--approve"
                          onClick={() => handleApproveEmoji(emoji.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="emoji-card__action-btn emoji-card__action-btn--reject"
                          onClick={() => {
                            setRejectingEmojiId(emoji.id);
                            setShowRejectModal(true);
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}

                    <button
                      className="emoji-card__action-btn emoji-card__action-btn--delete"
                      onClick={() => handleDeleteEmoji(emoji.id)}
                    >
                      Delete
                    </button>
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
                Page {pagination.page} of {pagination.totalPages} (
                {pagination.total} total)
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

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="emoji-approval-panel__modal-overlay">
          <div className="emoji-approval-panel__modal">
            <div className="emoji-approval-panel__modal-header">
              <h3>Reject Emoji</h3>
              <button
                onClick={() => setShowRejectModal(false)}
                className="emoji-approval-panel__modal-close"
              >
                ×
              </button>
            </div>
            <div className="emoji-approval-panel__modal-content">
              <label htmlFor="reject-reason">Reason for rejection:</label>
              <textarea
                id="reject-reason"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Please provide a reason for rejecting this emoji..."
                rows={4}
                required
              />
            </div>
            <div className="emoji-approval-panel__modal-actions">
              <button
                onClick={() => setShowRejectModal(false)}
                className="emoji-approval-panel__modal-btn emoji-approval-panel__modal-btn--cancel"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  rejectingEmojiId &&
                  handleRejectEmoji(rejectingEmojiId, rejectReason)
                }
                disabled={!rejectReason.trim()}
                className="emoji-approval-panel__modal-btn emoji-approval-panel__modal-btn--reject"
              >
                Reject Emoji
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
