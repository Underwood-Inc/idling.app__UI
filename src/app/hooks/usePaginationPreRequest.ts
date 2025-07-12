'use client';

import { useCallback, useEffect, useState } from 'react';
import { createLogger } from '@lib/logging';
import { getSubmissionsPaginationCount, GetSubmissionsPaginationCountResponse } from '../components/submissions-list/actions';
import { PostFilters } from '@lib/types/filters';
import { Filter } from '@lib/state/atoms';

const logger = createLogger({
  context: { component: 'usePaginationPreRequest' }
});

interface UsePaginationPreRequestProps {
  onlyMine?: boolean;
  userId?: string;
  filters?: Filter<PostFilters>[];
  pageSize?: number;
  includeThreadReplies?: boolean;
  enabled?: boolean;
}

interface PaginationPreRequestState {
  isLoading: boolean;
  data: {
    totalRecords: number;
    expectedItems: number;
  } | null;
  error: string | null;
  lastRequestKey: string;
}

export function usePaginationPreRequest({
  onlyMine = false,
  userId = '',
  filters = [],
  pageSize = 10,
  includeThreadReplies = false,
  enabled = true
}: UsePaginationPreRequestProps) {
  const [state, setState] = useState<PaginationPreRequestState>({
    isLoading: false,
    data: null,
    error: null,
    lastRequestKey: ''
  });

  const executePreRequest = useCallback(async () => {
    if (!enabled) return;

    // Create a key to prevent duplicate requests
    const requestKey = JSON.stringify({
      onlyMine,
      userId,
      filters,
      pageSize,
      includeThreadReplies
    });

    // Skip if this exact request was already made
    if (state.lastRequestKey === requestKey && state.data) {
      logger.debug('Skipping duplicate pagination pre-request', { requestKey });
      return;
    }

    logger.group('paginationPreRequest');
    logger.debug('Starting pagination pre-request', {
      onlyMine,
      userId,
      filtersCount: filters.length,
      pageSize,
      includeThreadReplies
    });

    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null,
      lastRequestKey: requestKey
    }));

    try {
      const result = await getSubmissionsPaginationCount({
        onlyMine,
        userId,
        filters,
        pageSize,
        includeThreadReplies
      });

      if (result.data) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          data: result.data!,
          error: null
        }));

        logger.debug('Pagination pre-request successful', {
          totalRecords: result.data.totalRecords,
          expectedItems: result.data.expectedItems
        });
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          data: null,
          error: result.error || 'Failed to fetch pagination count'
        }));

        logger.error('Pagination pre-request failed', new Error(result.error || 'Unknown error'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setState(prev => ({
        ...prev,
        isLoading: false,
        data: null,
        error: errorMessage
      }));

      logger.error('Pagination pre-request error', error as Error);
    } finally {
      logger.groupEnd();
    }
  }, [onlyMine, userId, filters, pageSize, includeThreadReplies, enabled, state.lastRequestKey, state.data]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      data: null,
      error: null,
      lastRequestKey: ''
    });
  }, []);

  // Execute pre-request when parameters change
  useEffect(() => {
    if (enabled) {
      executePreRequest();
    }
  }, [executePreRequest, enabled]);

  return {
    ...state,
    executePreRequest,
    reset
  };
}

export default usePaginationPreRequest;
