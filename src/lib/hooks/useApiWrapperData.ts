import { useAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import { updateSessionDataAtom } from '../state/atoms';

export interface ApiWrapperData {
  activeAlertsInfo?: {
    alerts: Array<{
      id: number;
      title: string;
      message: string;
      alert_type: string;
      priority: number;
      dismissible: boolean;
      expires_at?: string;
    }>;
    total_count: number;
    unread_count: number;
    high_priority_count: number;
    has_urgent: boolean;
  };
  timeoutInfo?: {
    is_timed_out: boolean;
    expires_at?: string;
    reason?: string;
    userInfo?: {
      id: number;
      username: string;
      email: string;
      is_active: boolean;
    };
    userValidated: boolean;
    lastValidated?: string;
  };
  userPermissions?: Record<string, string[]>;
  userRoles?: string[];
}

export type WrapperDataProcessor = (data: ApiWrapperData) => void;

class ApiWrapperDataManager {
  private processors: WrapperDataProcessor[] = [];

  register(processor: WrapperDataProcessor): () => void {
    this.processors.push(processor);
    return () => {
      const index = this.processors.indexOf(processor);
      if (index > -1) {
        this.processors.splice(index, 1);
      }
    };
  }

  process(data: ApiWrapperData): void {
    this.processors.forEach((processor) => {
      try {
        processor(data);
      } catch (error) {
        console.error('Error in API wrapper data processor:', error);
      }
    });
  }
}

// Global instance
const apiWrapperDataManager = new ApiWrapperDataManager();

/**
 * Hook to process API wrapper data from universal enhancements
 * This allows components to consume activeAlertsInfo, timeoutInfo, etc.
 * from any API response instead of polling dedicated endpoints
 */
export function useApiWrapperData(processor: WrapperDataProcessor) {
  const processorRef = useRef(processor);
  processorRef.current = processor;

  useEffect(() => {
    const wrappedProcessor = (data: ApiWrapperData) => {
      processorRef.current(data);
    };

    return apiWrapperDataManager.register(wrappedProcessor);
  }, []);
}

/**
 * Hook to automatically update session atom from API wrapper responses
 * This ensures the session atom stays current with every API response
 */
export function useSessionDataSync() {
  const [, updateSessionData] = useAtom(updateSessionDataAtom);

  useApiWrapperData((data) => {
    if (data.timeoutInfo) {
      updateSessionData({
        timeoutInfo: {
          is_timed_out: data.timeoutInfo.is_timed_out,
          lastValidated: data.timeoutInfo.lastValidated || null,
          reason: data.timeoutInfo.reason || null,
          userInfo: data.timeoutInfo.userInfo || null,
          userValidated: data.timeoutInfo.userValidated,
          expires_at: data.timeoutInfo.expires_at
            ? new Date(data.timeoutInfo.expires_at)
            : undefined
        },
        isValid:
          data.timeoutInfo.userValidated && !data.timeoutInfo.is_timed_out
      });
    }
  });
}

/**
 * Function to process API response data - should be called by API client code
 * when responses are received that contain wrapper data
 */
export function processApiWrapperData(data: ApiWrapperData) {
  apiWrapperDataManager.process(data);
}

/**
 * Convenience function to extract wrapper data from a fetch response
 * Usage: response.json().then(extractAndProcessWrapperData)
 */
export function extractAndProcessWrapperData(responseData: any) {
  if (!responseData) return responseData;

  const wrapperData: ApiWrapperData = {};

  if (responseData.activeAlertsInfo) {
    wrapperData.activeAlertsInfo = responseData.activeAlertsInfo;
  }

  if (responseData.timeoutInfo) {
    wrapperData.timeoutInfo = responseData.timeoutInfo;
  }

  if (responseData.userPermissions) {
    wrapperData.userPermissions = responseData.userPermissions;
  }

  if (responseData.userRoles) {
    wrapperData.userRoles = responseData.userRoles;
  }

  // Process the wrapper data if any was found
  if (Object.keys(wrapperData).length > 0) {
    processApiWrapperData(wrapperData);
  }

  return responseData;
}
