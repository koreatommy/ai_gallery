import { supabase } from './supabase';

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
    return this.getResizedUrl(path, size, size, 70);
  },

  /**
   * 이미지 파일 검증
   */
  validateImageFile(file: File): { valid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: '지원되지 않는 파일 형식입니다. (JPG, PNG, WebP, GIF만 지원)'
      };
    }

    if (file.size > maxSize) {
      return {
        valid: false,
        error: '파일 크기가 너무 큽니다. (최대 10MB)'
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
  }
};