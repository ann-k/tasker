import { useEffect, useRef, useState } from 'react';

import { getImageUrl } from '@/utils/imageStorage';

/**
 * Хук для получения blob:URL изображения из IndexedDB по imageId
 */
export const useImageUrl = (imageId: string | undefined): string | null => {
  const [url, setUrl] = useState<string | null>(null);
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!imageId) {
      // Освобождаем предыдущий URL
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setUrl(null);
      return;
    }

    let isMounted = true;

    getImageUrl(imageId)
      .then((blobUrl) => {
        if (isMounted) {
          // Освобождаем предыдущий URL перед установкой нового
          if (urlRef.current) {
            URL.revokeObjectURL(urlRef.current);
          }
          urlRef.current = blobUrl;
          setUrl(blobUrl);
        }
      })
      .catch((error) => {
        console.error('Failed to load image from IndexedDB:', error);
        if (isMounted) {
          setUrl(null);
        }
      });

    return () => {
      isMounted = false;
      // Освобождаем blob:URL при размонтировании или изменении imageId
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
    };
  }, [imageId]);

  return url;
};
