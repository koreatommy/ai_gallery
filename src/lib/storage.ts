import { supabase } from './supabase';
import { PerformanceService } from './performance';

export interface UploadResult {
  url: string;
  thumbnailUrl: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
}

export const storageService = {
  /**
   * 이미지 업로드
   */
  async uploadImage(file: File, folder: 'originals' | 'thumbnails' | 'temp' = 'originals'): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (error) {
      console.error('Storage upload error:', error);
      
      // 구체적인 에러 메시지 제공
      if (error.message.includes('Bucket not found')) {
        throw new Error('Storage 버킷이 설정되지 않았습니다. 관리자에게 문의해주세요.');
      } else if (error.message.includes('File size')) {
        throw new Error('파일 크기가 너무 큽니다. (최대 10MB)');
      } else if (error.message.includes('Invalid file type')) {
        throw new Error('지원되지 않는 파일 형식입니다.');
      } else {
        throw new Error(`업로드 실패: ${error.message}`);
      }
    }

    return data.path;
  },

  /**
   * 이미지 삭제
   */
  async deleteImage(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('images')
      .remove([path]);

    if (error) {
      throw new Error(`삭제 실패: ${error.message}`);
    }
  },

  /**
   * Public URL 생성
   */
  getPublicUrl(path: string): string {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(path);

    return data.publicUrl;
  },

  /**
   * 이미지 리사이즈 URL 생성 (Supabase Transform)
   */
  getResizedUrl(path: string, width?: number, height?: number, quality = 80): string {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(path, {
        transform: {
          width,
          height,
          quality,
        },
      });

    return data.publicUrl;
  },

  /**
   * 썸네일 URL 생성
   */
  getThumbnailUrl(path: string, size = 300): string {
    return this.getResizedUrl(path, size, size, 80);
  },

  /**
   * 이미지 파일 검증
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 50 * 1024 * 1024; // 50MB (Supabase 제한에 맞춤)

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '지원되지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 지원)'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: '파일 크기가 너무 큽니다. (최대 50MB) - 이미지 최적화를 통해 크기를 줄일 수 있습니다.'
      };
    }

    return { valid: true };
  },

  /**
   * 대용량 파일을 위한 경고 검증 (최적화 후 크기 예상)
   */
  validateLargeFile(file: File): { valid: boolean; warning?: string; estimatedSize?: number } {
    const maxSize = 50 * 1024 * 1024; // 50MB
    const warningThreshold = 20 * 1024 * 1024; // 20MB

    if (file.size > maxSize) {
      return {
        valid: false,
        warning: '파일이 매우 큽니다. 업로드 시간이 오래 걸릴 수 있습니다.'
      };
    }

    if (file.size > warningThreshold) {
      // WebP 압축 후 예상 크기 (대략 60-80% 감소)
      const estimatedSize = file.size * 0.3; // 70% 압축 가정
      
      return {
        valid: true,
        warning: `대용량 파일입니다. 최적화 후 약 ${(estimatedSize / 1024 / 1024).toFixed(1)}MB로 압축될 예정입니다.`,
        estimatedSize
      };
    }

    return { valid: true };
  },

  /**
   * 이미지 메타데이터 추출
   */
  async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);

      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('이미지를 불러올 수 없습니다.'));
      };

      img.src = url;
    });
  },

  /**
   * 이미지 최적화 (압축 + 포맷 변환)
   */
  async optimizeImage(file: File, options?: {
    quality?: number;
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): Promise<File> {
    const optimizationOptions = {
      quality: options?.quality || 0.8,
      width: options?.width || 1920,
      height: options?.height || 1080,
      format: options?.format || 'webp' as const
    };

    try {
      const compressedBlob = await PerformanceService.compressImage(file, optimizationOptions);
      
      return new File([compressedBlob], file.name.replace(/\.[^/.]+$/, `.${optimizationOptions.format}`), {
        type: `image/${optimizationOptions.format}`,
        lastModified: Date.now()
      });
    } catch (error) {
      console.error('이미지 최적화 실패:', error);
      throw new Error('이미지 최적화에 실패했습니다.');
    }
  },

  /**
   * 최적화된 이미지 업로드
   */
  async uploadOptimizedImage(file: File, folder: 'originals' | 'thumbnails' | 'temp' = 'originals', options?: {
    quality?: number;
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): Promise<string> {
    try {
      // 이미지 최적화
      const optimizedFile = await this.optimizeImage(file, options);
      
      // 최적화된 파일 업로드
      return await this.uploadImage(optimizedFile, folder);
    } catch (error) {
      console.error('최적화된 업로드 실패:', error);
      // 최적화 실패 시 원본 업로드
      return await this.uploadImage(file, folder);
    }
  },

  /**
   * 완전한 이미지 업로드 (원본 + 썸네일)
   */
  async uploadImageComplete(file: File): Promise<UploadResult> {
    try {
      // 파일 검증
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 이미지 크기 정보 추출
      const dimensions = await this.getImageDimensions(file);

      // 원본 업로드
      const originalPath = await this.uploadImage(file, 'originals');
      const originalUrl = this.getPublicUrl(originalPath);

      // 썸네일 URL 생성 (Supabase Transform 사용)
      const thumbnailUrl = this.getThumbnailUrl(originalPath);

      return {
        url: originalUrl,
        thumbnailUrl,
        fileName: file.name,
        fileSize: file.size,
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      console.error('Complete upload error:', error);
      
      // Supabase 연결 확인
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Supabase 서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
      }
      
      throw error;
    }
  },

  /**
   * 완전한 최적화된 이미지 업로드 (압축 + WebP 변환)
   */
  async uploadOptimizedImageComplete(file: File, options?: {
    quality?: number;
    width?: number;
    height?: number;
    format?: 'webp' | 'jpeg' | 'png';
  }): Promise<UploadResult> {
    try {
      // 파일 검증
      const validation = this.validateImageFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // 이미지 최적화
      const optimizedFile = await this.optimizeImage(file, options);
      
      // 이미지 크기 정보 추출 (최적화된 파일 기준)
      const dimensions = await this.getImageDimensions(optimizedFile);

      // 최적화된 이미지 업로드
      const originalPath = await this.uploadImage(optimizedFile, 'originals');
      const originalUrl = this.getPublicUrl(originalPath);

      // 썸네일 URL 생성 (Supabase Transform 사용)
      const thumbnailUrl = this.getThumbnailUrl(originalPath);

      return {
        url: originalUrl,
        thumbnailUrl,
        fileName: optimizedFile.name,
        fileSize: optimizedFile.size,
        width: dimensions.width,
        height: dimensions.height,
      };
    } catch (error) {
      console.error('최적화된 업로드 실패:', error);
      
      // Supabase 연결 확인
      if (error instanceof Error && error.message.includes('fetch')) {
        throw new Error('Supabase 서버에 연결할 수 없습니다. 인터넷 연결을 확인해주세요.');
      }
      
      throw error;
    }
  }
};