'use client';

import { useState, useEffect, useCallback } from 'react';
import { PerformanceService } from '@/lib/performance';

// MemoryInfo 타입 정의 (브라우저 API)
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface UseImageOptimizationOptions {
  enableLazyLoading?: boolean;
  preloadCount?: number;
  compressionQuality?: number;
  cacheEnabled?: boolean;
}

interface ImageOptimizationState {
  isSupportsWebP: boolean;
  isLoading: boolean;
  loadedImages: Set<string>;
  failedImages: Set<string>;
  memoryUsage: MemoryInfo | null;
}

export function useImageOptimization(options: UseImageOptimizationOptions = {}) {
  const {
    enableLazyLoading = true,
    preloadCount = 5,
    compressionQuality = 0.8,
    cacheEnabled = true
  } = options;

  const [state, setState] = useState<ImageOptimizationState>({
    isSupportsWebP: false,
    isLoading: true,
    loadedImages: new Set(),
    failedImages: new Set(),
    memoryUsage: null
  });

  // WebP 지원 여부 확인
  useEffect(() => {
    const checkWebPSupport = async () => {
      try {
        const supportsWebP = await PerformanceService.supportsWebP();
        setState(prev => ({
          ...prev,
          isSupportsWebP: supportsWebP,
          isLoading: false
        }));
      } catch (error) {
        console.error('WebP 지원 확인 실패:', error);
        setState(prev => ({
          ...prev,
          isLoading: false
        }));
      }
    };

    checkWebPSupport();
  }, []);

  // 메모리 사용량 모니터링
  useEffect(() => {
    const updateMemoryUsage = () => {
      const memory = PerformanceService.getMemoryUsage();
      setState(prev => ({ ...prev, memoryUsage: memory }));
    };

    updateMemoryUsage();
    const interval = setInterval(updateMemoryUsage, 5000); // 5초마다 업데이트

    return () => clearInterval(interval);
  }, []);

  // 이미지 사전 로드
  const preloadImages = useCallback(async (urls: string[]) => {
    if (!cacheEnabled) return;

    const urlsToPreload = urls.slice(0, preloadCount);
    
    try {
      await PerformanceService.preloadImages(urlsToPreload);
      setState(prev => ({
        ...prev,
        loadedImages: new Set([...prev.loadedImages, ...urlsToPreload])
      }));
    } catch (error) {
      console.error('이미지 사전 로드 실패:', error);
    }
  }, [preloadCount, cacheEnabled]);

  // 최적화된 이미지 URL 생성
  const getOptimizedImageUrl = useCallback((
    originalUrl: string,
    width?: number,
    height?: number
  ): string => {
    if (!originalUrl) return '';

    // Supabase Transform API 사용
    const url = new URL(originalUrl);
    const params = new URLSearchParams();

    if (width) params.set('width', width.toString());
    if (height) params.set('height', height.toString());
    if (state.isSupportsWebP) params.set('format', 'webp');
    params.set('quality', '80');

    if (params.toString()) {
      url.search = params.toString();
    }

    return url.toString();
  }, [state.isSupportsWebP]);

  // 관리자용 고품질 썸네일 URL 생성
  const getAdminThumbnailUrl = useCallback((
    originalUrl: string,
    width = 600,
    height = 400
  ): string => {
    if (!originalUrl) return '';

    // Supabase Transform API 사용 (관리자용 고품질)
    const url = new URL(originalUrl);
    const params = new URLSearchParams();

    params.set('width', width.toString());
    params.set('height', height.toString());
    if (state.isSupportsWebP) params.set('format', 'webp');
    params.set('quality', '90'); // 관리자용 고품질

    if (params.toString()) {
      url.search = params.toString();
    }

    return url.toString();
  }, [state.isSupportsWebP]);

  // 모바일용 고해상도 썸네일 URL 생성
  const getMobileThumbnailUrl = useCallback((
    originalUrl: string,
    size = 400
  ): string => {
    if (!originalUrl) return '';

    // Supabase Transform API 사용 (모바일용 고해상도)
    const url = new URL(originalUrl);
    const params = new URLSearchParams();

    params.set('width', size.toString());
    params.set('height', size.toString());
    if (state.isSupportsWebP) params.set('format', 'webp');
    params.set('quality', '85'); // 모바일용 고품질

    if (params.toString()) {
      url.search = params.toString();
    }

    return url.toString();
  }, [state.isSupportsWebP]);

  // 이미지 압축
  const compressImage = useCallback(async (file: File, options?: {
    width?: number;
    height?: number;
    quality?: number;
  }): Promise<Blob> => {
    const compressionOptions = {
      quality: options?.quality || compressionQuality,
      width: options?.width,
      height: options?.height,
      format: state.isSupportsWebP ? 'webp' as const : 'jpeg' as const
    };

    return PerformanceService.compressImage(file, compressionOptions);
  }, [compressionQuality, state.isSupportsWebP]);

  // 썸네일 생성
  const generateThumbnail = useCallback(async (file: File, size = 300): Promise<Blob> => {
    return PerformanceService.generateThumbnail(file, size);
  }, []);

  // 이미지 로드 상태 추적
  const trackImageLoad = useCallback(async (src: string) => {
    try {
      const metrics = await PerformanceService.trackImageLoad(src);
      setState(prev => ({
        ...prev,
        loadedImages: new Set([...prev.loadedImages, src])
      }));
      return metrics;
    } catch (error) {
      setState(prev => ({
        ...prev,
        failedImages: new Set([...prev.failedImages, src])
      }));
      throw error;
    }
  }, []);

  // 레이지 로딩 설정
  const setupLazyLoading = useCallback((imgElement: HTMLImageElement) => {
    if (!enableLazyLoading) return;

    PerformanceService.observeImage(imgElement);
  }, [enableLazyLoading]);

  // 이미지 우선순위 설정
  const setImagePriority = useCallback((
    imgElement: HTMLImageElement,
    priority: 'high' | 'low' | 'auto' = 'auto'
  ) => {
    PerformanceService.setImagePriority(imgElement, priority);
  }, []);

  // 캐시 정리
  const clearCache = useCallback(() => {
    PerformanceService.clearImageCache();
    setState(prev => ({
      ...prev,
      loadedImages: new Set(),
      failedImages: new Set()
    }));
  }, []);

  // 성능 메트릭 수집
  const collectMetrics = useCallback(() => {
    return PerformanceService.collectPerformanceMetrics();
  }, []);

  // 반응형 이미지 크기 계산
  const getResponsiveImageSizes = useCallback((containerWidth: number, breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280
  }) => {
    const sizes = [];
    
    if (containerWidth <= breakpoints.sm) {
      sizes.push(`(max-width: ${breakpoints.sm}px) ${containerWidth}px`);
    } else if (containerWidth <= breakpoints.md) {
      sizes.push(`(max-width: ${breakpoints.md}px) ${containerWidth}px`);
    } else if (containerWidth <= breakpoints.lg) {
      sizes.push(`(max-width: ${breakpoints.lg}px) ${containerWidth}px`);
    } else {
      sizes.push(`${containerWidth}px`);
    }

    return sizes.join(', ');
  }, []);

  return {
    // 상태
    isSupportsWebP: state.isSupportsWebP,
    isLoading: state.isLoading,
    loadedImages: Array.from(state.loadedImages),
    failedImages: Array.from(state.failedImages),
    memoryUsage: state.memoryUsage,
    cacheSize: PerformanceService.getCacheSize(),

    // 메서드
    preloadImages,
    getOptimizedImageUrl,
    getAdminThumbnailUrl,
    getMobileThumbnailUrl,
    compressImage,
    generateThumbnail,
    trackImageLoad,
    setupLazyLoading,
    setImagePriority,
    clearCache,
    collectMetrics,
    getResponsiveImageSizes
  };
}