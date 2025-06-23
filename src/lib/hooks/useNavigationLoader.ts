'use client';

import { useNavigationLoading } from '../context/NavigationLoadingContext';

export function useNavigationLoader() {
  return useNavigationLoading();
}
