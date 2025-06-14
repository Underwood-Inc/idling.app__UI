import { useEffect, useState } from 'react';

export interface LinkPreviewData {
  title: string;
  description?: string;
  image?: string;
  url: string;
}

export function useLinkPreview(url: string | null) {
  const [data, setData] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPreview = async () => {
      if (!url) {
        setData(null);
        setLoading(false);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/link-preview?url=${encodeURIComponent(url)}`
        );
        if (!response.ok) throw new Error('Failed to fetch preview');

        const previewData = await response.json();
        if (isMounted) {
          setData(previewData);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load preview'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPreview();

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error };
}
