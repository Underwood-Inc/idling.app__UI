'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Username } from '../username';
import './UserSearch.css';

interface UserSearchResult {
  id: string;
  name: string;
  email?: string;
  username?: string;
  image?: string;
}

interface UserSearchProps {
  placeholder?: string;
  className?: string;
  onUserSelect?: (user: UserSearchResult) => void;
}

export function UserSearch({
  placeholder = 'Search for users...',
  className = '',
  onUserSelect
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [authError, setAuthError] = useState<string | null>(null);

  const { status } = useSession();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Debounced search function
  const searchUsers = useCallback(
    async (searchQuery: string) => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setResults([]);
        setIsOpen(false);
        setAuthError(null);
        return;
      }

      // Check if user is authenticated
      if (status === 'unauthenticated') {
        setAuthError('🔒 Please login to search for users');
        setResults([]);
        setIsOpen(true);
        return;
      }

      if (status === 'loading') {
        // Still checking auth status, wait
        return;
      }

      setIsLoading(true);
      setAuthError(null);
      try {
        const response = await fetch(
          `/api/users/search?q=${encodeURIComponent(searchQuery)}&limit=8`
        );

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            setAuthError('🔒 Please login to search for users');
          } else {
            setAuthError(`Search failed (${response.status})`);
          }
          setResults([]);
          setIsOpen(true);
          return;
        }

        const data = await response.json();
        setResults(data.users || []);
        setIsOpen(true);
      } catch (error) {
        console.error('Search error:', error);
        setAuthError('Network error occurred while searching');
        setResults([]);
        setIsOpen(true);
      } finally {
        setIsLoading(false);
      }
    },
    [status]
  );

  // Handle user selection
  const handleUserSelect = useCallback(
    (user: UserSearchResult) => {
      setQuery('');
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);

      if (onUserSelect) {
        onUserSelect(user);
      } else {
        // Navigate to user profile
        router.push(`/profile/${user.id}`);
      }
    },
    [onUserSelect, router]
  );

  // Debounce search requests
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query, searchUsers]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleUserSelect(results[selectedIndex]);
          }
          break;
        case 'Escape':
          setIsOpen(false);
          setSelectedIndex(-1);
          inputRef.current?.blur();
          break;
      }
    },
    [isOpen, results, selectedIndex, handleUserSelect]
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`user-search ${className}`} ref={searchRef}>
      <div className="user-search__input-container">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="user-search__input"
          autoComplete="off"
        />
        <div className="user-search__icon">
          {isLoading ? (
            <div className="user-search__spinner" />
          ) : (
            <span>🔍</span>
          )}
        </div>
      </div>

      {isOpen && results.length > 0 && (
        <div className="user-search__dropdown">
          <div className="user-search__results">
            {results.map((user, index) => (
              <button
                key={user.id}
                className={`user-search__result ${
                  index === selectedIndex ? 'user-search__result--selected' : ''
                }`}
                onClick={() => handleUserSelect(user)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="user-search__result-content">
                  <div className="user-search__result-info">
                    <Username
                      userId={user.id}
                      displayName={
                        user.name || user.username || 'Anonymous User'
                      }
                      size="sm"
                      weight="medium"
                      className="user-search__result-name"
                      data-testid={`search-username-${user.id}`}
                    />
                    {user.email && (
                      <span className="user-search__result-email">
                        {user.email}
                      </span>
                    )}
                  </div>
                  <div className="user-search__result-action">
                    <span className="user-search__result-arrow">→</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {isOpen && query.length >= 2 && !isLoading && authError && (
        <div className="user-search__dropdown">
          <div className="user-search__auth-error">
            <span className="user-search__auth-error-icon">🔒</span>
            <span className="user-search__auth-error-text">{authError}</span>
            {status === 'unauthenticated' && (
              <button
                className="user-search__login-button"
                onClick={() => router.push('/auth/signin')}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      )}

      {isOpen &&
        query.length >= 2 &&
        !isLoading &&
        !authError &&
        results.length === 0 && (
          <div className="user-search__dropdown">
            <div className="user-search__no-results">
              <span className="user-search__no-results-icon">🤷‍♂️</span>
              <span className="user-search__no-results-text">
                No users found for &quot;{query}&quot;
              </span>
            </div>
          </div>
        )}
    </div>
  );
}
