// 이미지 최적화 및 성능 관련 유틸리티

// MemoryInfo 타입 정의 (브라우저 API)
interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

export interface ImageOptimizationOptions {
  quality?: number;
  width?: number;
  height?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

export class PerformanceService {
  private static imageCache = new Map<string, HTMLImageElement>();
  private static observer: IntersectionObserver | null = null;

  // 이미지 사전 로드
  static preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return Promise.resolve(this.imageCache.get(src)!);
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        this.imageCache.set(src, img);
        resolve(img);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  // 다중 이미지 사전 로드
  static async preloadImages(srcs: string[]): Promise<HTMLImageElement[]> {
    const promises = srcs.map(src => this.preloadImage(src));
    return Promise.all(promises);
  }

  // 레이지 로딩 관찰자 설정
  static setupLazyLoading(): IntersectionObserver {
    if (this.observer) {
      return this.observer;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            
            if (src) {
              img.src = src;
              img.onload = () => {
                img.classList.add('loaded');
              };
              this.observer!.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    return this.observer;
  }

  // 이미지 요소에 레이지 로딩 적용
  static observeImage(img: HTMLImageElement) {
    if (!this.observer) {
      this.setupLazyLoading();
    }
    this.observer!.observe(img);
  }

  // WebP 지원 여부 확인
  static async supportsWebP(): Promise<boolean> {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  // 이미지 압축 (Canvas 사용)
  static compressImage(file: File, options: ImageOptimizationOptions = {}): Promise<Blob> {
    const { quality = 0.8, width, height, format = 'jpeg' } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // 크기 계산
        let { width: imgWidth, height: imgHeight } = img;
        
        if (width || height) {
          const aspectRatio = imgWidth / imgHeight;
          
          if (width && height) {
            imgWidth = width;
            imgHeight = height;
          } else if (width) {
            imgWidth = width;
            imgHeight = width / aspectRatio;
          } else if (height) {
            imgHeight = height;
            imgWidth = height * aspectRatio;
          }
        }

        canvas.width = imgWidth;
        canvas.height = imgHeight;

        // 이미지 그리기
        ctx.drawImage(img, 0, 0, imgWidth, imgHeight);

        // Blob으로 변환
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          `image/${format}`,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  // 썸네일 생성
  static generateThumbnail(file: File, size = 300): Promise<Blob> {
    return this.compressImage(file, {
      width: size,
      height: size,
      quality: 0.7,
      format: 'jpeg'
    });
  }

  // 메모리 사용량 모니터링
  static getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }

  // 이미지 캐시 정리
  static clearImageCache() {
    this.imageCache.clear();
  }

  // 캐시 크기 확인
  static getCacheSize(): number {
    return this.imageCache.size;
  }

  // 브라우저 지원 기능 확인
  static getBrowserCapabilities() {
    return {
      webp: this.supportsWebP(),
      intersectionObserver: 'IntersectionObserver' in window,
      requestIdleCallback: 'requestIdleCallback' in window,
      webWorkers: 'Worker' in window,
      serviceWorker: 'serviceWorker' in navigator,
      localStorage: 'localStorage' in window,
      indexedDB: 'indexedDB' in window
    };
  }

  // 디바운스 유틸리티
  static debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // 스로틀 유틸리티
  static throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // 이미지 로드 상태 추적
  static trackImageLoad(src: string): Promise<{ width: number; height: number; loadTime: number }> {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const loadTime = performance.now() - startTime;
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          loadTime
        });
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${src}`));
      };
      
      img.src = src;
    });
  }

  // 가상화된 리스트를 위한 아이템 높이 계산
  static calculateItemHeight(
    containerWidth: number,
    imageWidth: number,
    imageHeight: number,
    padding = 16
  ): number {
    const aspectRatio = imageHeight / imageWidth;
    const scaledHeight = containerWidth * aspectRatio;
    return scaledHeight + padding;
  }

  // 성능 메트릭 수집
  static collectPerformanceMetrics() {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    const paint = performance.getEntriesByType('paint');
    
    return {
      // 페이지 로드 시간
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
      
      // 렌더링 시간
      firstPaint: paint.find(entry => entry.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: paint.find(entry => entry.name === 'first-contentful-paint')?.startTime || 0,
      
      // 네트워크
      dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcpConnection: navigation.connectEnd - navigation.connectStart,
      
      // 메모리 (Chrome only)
      memory: this.getMemoryUsage()
    };
  }

  // 이미지 로딩 우선순위 설정
  static setImagePriority(img: HTMLImageElement, priority: 'high' | 'low' | 'auto' = 'auto') {
    if ('fetchPriority' in img) {
      (img as any).fetchPriority = priority;
    }
    
    if ('loading' in img) {
      img.loading = priority === 'high' ? 'eager' : 'lazy';
    }
  }
}