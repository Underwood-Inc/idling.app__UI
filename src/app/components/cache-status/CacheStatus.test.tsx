import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CacheStatus from './CacheStatus';

// Mock MessageChannel for tests
(global as any).MessageChannel = class MockMessageChannel {
  port1 = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: jest.fn()
  };
  port2 = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage: jest.fn()
  };
};

// Mock the caches API
const mockCache = {
  match: jest.fn(),
  put: jest.fn(),
  delete: jest.fn()
};

const mockCaches = {
  open: jest.fn().mockResolvedValue(mockCache)
};

Object.defineProperty(global, 'caches', {
  value: mockCaches,
  writable: true
});

// Mock navigator.serviceWorker
const mockServiceWorker = {
  controller: {
    postMessage: jest.fn()
  }
};

Object.defineProperty(navigator, 'serviceWorker', {
  value: mockServiceWorker,
  writable: true
});

// Mock location
const mockLocation = {
  pathname: '/',
  href: 'https://example.com/',
  reload: jest.fn()
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
});

// Mock Response with json method
class MockResponse {
  headers: Map<string, string>;

  constructor(body: any, init?: { headers?: Record<string, string> }) {
    this.headers = new Map();
    if (init?.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }

  json() {
    return Promise.resolve({
      url: '/',
      timestamp: Date.now(),
      cachedAt: new Date().toISOString()
    });
  }

  get(header: string) {
    return this.headers.get(header) || null;
  }
}

describe('CacheStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console warnings in tests
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display "Live" when content is not cached', async () => {
    mockCache.match.mockResolvedValue(null);

    render(<CacheStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });

    expect(screen.getByText('●')).toHaveClass('cache-status__indicator--live');
  });

  it('should display cache age when content is cached', async () => {
    const mockResponse = {
      headers: {
        get: jest.fn().mockImplementation((header) => {
          if (header === 'Cache-Timestamp') {
            return (Date.now() - 60000).toString(); // 1 minute ago
          }
          return null;
        })
      }
    };

    mockCache.match.mockResolvedValue(mockResponse);

    render(<CacheStatus />);

    await waitFor(() => {
      expect(screen.getByText(/Cached/)).toBeInTheDocument();
    });

    expect(screen.getByText('●')).toHaveClass(
      'cache-status__indicator--cached'
    );
    expect(
      screen.getByRole('button', { name: /refresh cache/i })
    ).toBeInTheDocument();
  });

  it('should show refresh button when content is cached', async () => {
    const mockResponse = {
      headers: {
        get: jest.fn().mockReturnValue(Date.now().toString())
      }
    };

    mockCache.match.mockResolvedValue(mockResponse);

    render(<CacheStatus />);

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', {
        name: /refresh cache/i
      });
      expect(refreshButton).toBeInTheDocument();
      expect(refreshButton).toHaveTextContent('↻');
    });
  });

  it('should handle refresh button click', async () => {
    const mockResponse = {
      headers: {
        get: jest.fn().mockReturnValue(Date.now().toString())
      }
    };

    mockCache.match.mockResolvedValue(mockResponse);

    render(<CacheStatus />);

    await waitFor(() => {
      const refreshButton = screen.getByRole('button', {
        name: /refresh cache/i
      });
      fireEvent.click(refreshButton);
      expect(refreshButton).toHaveTextContent('⟳');
    });
  });

  it('should handle cache check errors gracefully', async () => {
    mockCache.match.mockRejectedValue(new Error('Cache error'));

    render(<CacheStatus />);

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument();
    });
  });

  it('should format time ago correctly', async () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hour ago
    const mockResponse = {
      headers: {
        get: jest.fn().mockImplementation((header) => {
          if (header === 'Cache-Timestamp') {
            return oneHourAgo.toString();
          }
          return null;
        })
      }
    };

    mockCache.match.mockResolvedValue(mockResponse);

    render(<CacheStatus />);

    await waitFor(() => {
      expect(screen.getByText(/Cached/)).toBeInTheDocument();
      expect(screen.getByText(/1h/)).toBeInTheDocument();
    });
  });

  it('should fallback to response headers when metadata is not available', async () => {
    const mockResponse = new MockResponse(null, {
      headers: {
        'Cache-Date': new Date().toISOString()
      }
    });

    // Mock the metadata cache to return null (no metadata)
    const mockMetadataCache = {
      match: jest.fn().mockResolvedValue(null)
    };

    mockCaches.open.mockImplementation((cacheName) => {
      if (cacheName === 'idling-app-cache-metadata-v1') {
        return Promise.resolve(mockMetadataCache);
      }
      return Promise.resolve(mockCache);
    });

    mockCache.match.mockResolvedValue(mockResponse);

    render(<CacheStatus />);

    await waitFor(() => {
      expect(screen.getByText(/Cached/)).toBeInTheDocument();
    });
  });
});
