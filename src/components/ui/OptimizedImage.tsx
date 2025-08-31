'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useImageOptimization } from '@/hooks/useImageOptimization';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  quality?: number;
  priority?: 'high' | 'low' | 'auto';
  lazy?: boolean;
  placeholder?: string | boolean;
  onLoad?: () => void;
  onError?: () => void;
  sizes?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  quality = 80,
  priority = 'auto',
  lazy = true,
  placeholder = true,
  onLoad,
  onError,
  sizes,
  objectFit = 'cover',
  ...props
}: OptimizedImageProps) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');

  const {
    isSupportsWebP,
    getOptimizedImageUrl,
    setupLazyLoading,
    setImagePriority,
    trackImageLoad
  } = useImageOptimization();

  // 최적화된 URL 생성
  useEffect(() => {
    if (src && !isLoaded) {
      const optimizedUrl = getOptimizedImageUrl(src, width, height);
      setCurrentSrc(optimizedUrl);
    }
  }, [src, width, height, getOptimizedImageUrl, isLoaded]);

  // 이미지 로드 완료 처리
  const handleLoad = async () => {
    setIsLoaded(true);
    setIsError(false);
    
    try {
      if (currentSrc) {
        await trackImageLoad(currentSrc);
      }
    } catch (error) {
      console.warn('이미지 로드 추적 실패:', error);
    }
    
    onLoad?.();
  };

  // 이미지 로드 실패 처리
  const handleError = () => {
    setIsError(true);
    setIsLoaded(false);
    onError?.();
  };

  // 레이지 로딩 및 우선순위 설정
  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    // 우선순위 설정
    setImagePriority(imgElement, priority);

    // 레이지 로딩 설정
    if (lazy && priority !== 'high') {
      setupLazyLoading(imgElement);
    }
  }, [lazy, priority, setupLazyLoading, setImagePriority]);

  // 플레이스홀더 생성
  const getPlaceholder = () => {
    if (placeholder === false) return null;
    
    if (typeof placeholder === 'string') {
      return placeholder;
    }
    
    // 기본 플레이스홀더 (블러 효과용 작은 이미지)
    if (width && height) {
      const ratio = height / width;
      const placeholderWidth = 20;
      const placeholderHeight = Math.round(placeholderWidth * ratio);
      
      return getOptimizedImageUrl(src, placeholderWidth, placeholderHeight);
    }
    
    return null;
  };

  const placeholderSrc = getPlaceholder();

  // 에러 상태 렌더링
  if (isError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          'min-h-[200px]',
          className
        )}
        style={{ width, height }}
      >
        <div className="text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm">이미지를 불러올 수 없습니다</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      {/* 플레이스홀더 이미지 (블러 효과) */}
      {placeholderSrc && !isLoaded && (
        <img
          src={placeholderSrc}
          alt=""
          className={cn(
            'absolute inset-0 w-full h-full transition-opacity duration-300',
            'filter blur-md scale-105',
            className
          )}
          style={{ objectFit }}
          aria-hidden="true"
        />
      )}

      {/* 메인 이미지 */}
      <img
        ref={imgRef}
        src={lazy && priority !== 'high' ? undefined : currentSrc}
        data-src={lazy && priority !== 'high' ? currentSrc : undefined}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        loading={lazy && priority !== 'high' ? 'lazy' : 'eager'}
        decoding="async"
        className={cn(
          'transition-opacity duration-300',
          isLoaded ? 'opacity-100' : 'opacity-0',
          !isLoaded && !placeholderSrc && 'bg-gray-100',
          className
        )}
        style={{ objectFit, width, height }}
        {...props}
      />

      {/* 로딩 스피너 */}
      {!isLoaded && !placeholderSrc && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-600"></div>
        </div>
      )}

      {/* 로드 완료 인디케이터 */}
      {isLoaded && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black/50 text-white text-xs px-2 py-1 rounded">
            {isSupportsWebP ? 'WebP' : 'JPEG'}
          </div>
        </div>
      )}
    </div>
  );
}