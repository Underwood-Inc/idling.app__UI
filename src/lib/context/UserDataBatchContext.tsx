'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState
} from 'react';

interface UserDecorationCache {
  [userId: string]: string | null | undefined; // undefined = not loaded yet
}

interface BatchRequest {
  userIds: Set<string>;
  callbacks: Map<string, ((decoration: string | null) => void)[]>;
}

interface UserDataBatchContextValue {
  getUserDecoration: (
    userId: string,
    callback: (decoration: string | null) => void
  ) => void;
  prefetchDecorations: (userIds: string[]) => Promise<void>;
}

const UserDataBatchContext = createContext<
  UserDataBatchContextValue | undefined
>(undefined);

interface UserDataBatchProviderProps {
  children: React.ReactNode;
  batchDelay?: number; // How long to wait before batching (ms)
}

/**
 * Provider that batches user decoration requests to reduce API calls
 * Instead of making N requests for N users, makes 1 request for all users
 */
export function UserDataBatchProvider({
  children,
  batchDelay = 50 // Wait 50ms to collect requests before batching
}: UserDataBatchProviderProps) {
  const [cache, setCache] = useState<UserDecorationCache>({});
  const pendingRequest = useRef<BatchRequest>({
    userIds: new Set(),
    callbacks: new Map()
  });
  const batchTimeout = useRef<NodeJS.Timeout | null>(null);
  const inflightRequest = useRef<Promise<void> | null>(null);

  // Execute the batch request
  const executeBatch = useCallback(async () => {
    if (pendingRequest.current.userIds.size === 0) {
      return;
    }

    const userIds = Array.from(pendingRequest.current.userIds);
    const callbacks = new Map(pendingRequest.current.callbacks);

    // Clear pending request
    pendingRequest.current = {
      userIds: new Set(),
      callbacks: new Map()
    };

    // Don't fetch userIds that are already in cache
    const userIdsToFetch = userIds.filter((id) => cache[id] === undefined);

    if (userIdsToFetch.length === 0) {
      // All data is in cache, just call callbacks
      userIds.forEach((userId) => {
        const userCallbacks = callbacks.get(userId);
        if (userCallbacks) {
          const decoration = cache[userId] || null;
          userCallbacks.forEach((cb) => cb(decoration));
        }
      });
      return;
    }

    try {
      // Make batch request
      const response = await fetch('/api/users/batch-decorations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Background-Request': 'true' // Don't trigger loader
        },
        body: JSON.stringify({ userIds: userIdsToFetch })
      });

      if (response.ok) {
        const data = await response.json();
        const decorations = data.decorations || {};

        // Update cache
        setCache((prev) => ({ ...prev, ...decorations }));

        // Call all callbacks with their results
        userIds.forEach((userId) => {
          const userCallbacks = callbacks.get(userId);
          if (userCallbacks) {
            const decoration =
              decorations[userId] !== undefined
                ? decorations[userId]
                : cache[userId] || null;
            userCallbacks.forEach((cb) => cb(decoration));
          }
        });
      } else {
        // On error, call callbacks with null
        userIds.forEach((userId) => {
          const userCallbacks = callbacks.get(userId);
          if (userCallbacks) {
            userCallbacks.forEach((cb) => cb(null));
          }
        });
      }
    } catch (error) {
      console.error('Batch decoration fetch failed:', error);
      // On error, call callbacks with null
      userIds.forEach((userId) => {
        const userCallbacks = callbacks.get(userId);
        if (userCallbacks) {
          userCallbacks.forEach((cb) => cb(null));
        }
      });
    } finally {
      inflightRequest.current = null;
    }
  }, [cache]);

  // Schedule a batch request
  const scheduleBatch = useCallback(() => {
    if (batchTimeout.current) {
      clearTimeout(batchTimeout.current);
    }

    batchTimeout.current = setTimeout(() => {
      if (!inflightRequest.current) {
        inflightRequest.current = executeBatch();
      }
    }, batchDelay);
  }, [batchDelay, executeBatch]);

  // Request a user decoration (adds to batch)
  const getUserDecoration = useCallback(
    (userId: string, callback: (decoration: string | null) => void) => {
      // If already in cache, return immediately
      if (cache[userId] !== undefined) {
        callback(cache[userId]!);
        return;
      }

      // Add to pending batch
      pendingRequest.current.userIds.add(userId);

      const existing = pendingRequest.current.callbacks.get(userId) || [];
      existing.push(callback);
      pendingRequest.current.callbacks.set(userId, existing);

      // Schedule batch
      scheduleBatch();
    },
    [cache, scheduleBatch]
  );

  // Prefetch decorations for a list of users (useful for post lists)
  const prefetchDecorations = useCallback(
    async (userIds: string[]) => {
      const userIdsToFetch = userIds.filter((id) => cache[id] === undefined);

      if (userIdsToFetch.length === 0) {
        return;
      }

      try {
        const response = await fetch('/api/users/batch-decorations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Background-Request': 'true'
          },
          body: JSON.stringify({ userIds: userIdsToFetch })
        });

        if (response.ok) {
          const data = await response.json();
          const decorations = data.decorations || {};
          setCache((prev) => ({ ...prev, ...decorations }));
        }
      } catch (error) {
        console.error('Prefetch decorations failed:', error);
      }
    },
    [cache]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (batchTimeout.current) {
        clearTimeout(batchTimeout.current);
      }
    };
  }, []);

  return (
    <UserDataBatchContext.Provider
      value={{ getUserDecoration, prefetchDecorations }}
    >
      {children}
    </UserDataBatchContext.Provider>
  );
}

/**
 * Hook to access the batch context
 */
export function useUserDataBatch() {
  const context = useContext(UserDataBatchContext);
  if (!context) {
    throw new Error(
      'useUserDataBatch must be used within UserDataBatchProvider'
    );
  }
  return context;
}

