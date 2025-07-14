import { useEffect, useRef } from 'react';

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
  };
  userPermissions?: Record<string, string[]>;
  userRoles?: string[];
}

type WrapperDataProcessor = (data: ApiWrapperData) => void;

class ApiWrapperDataManager {
  private processors: Set<WrapperDataProcessor> = new Set();

  register(processor: WrapperDataProcessor) {
    this.processors.add(processor);
    return () => {
      this.processors.delete(processor);
    };
  }

  process(data: ApiWrapperData) {
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
