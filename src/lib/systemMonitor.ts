import { supabase } from './supabase';

// 모니터링 설정
const MONITORING_CONFIG = {
  // 응답 시간 임계값 (ms)
  API_RESPONSE_TIME_WARNING: 1000,
  API_RESPONSE_TIME_ERROR: 2000,
  
  // CDN 로딩 시간 임계값 (ms)
  // 로컬 환경: 5000/8000, 프로덕션 환경: 2000/3000
  CDN_LOAD_TIME_WARNING: process.env.NODE_ENV === 'production' ? 2000 : 5000,
  CDN_LOAD_TIME_ERROR: process.env.NODE_ENV === 'production' ? 3000 : 8000,
  
  // 스토리지 사용률 임계값 (%)
  STORAGE_WARNING_THRESHOLD: 80,
  STORAGE_ERROR_THRESHOLD: 90,
  
  // API 성공률 임계값 (%)
  // 로컬 환경: 30%, 프로덕션 환경: 80%
  API_SUCCESS_RATE_THRESHOLD: process.env.NODE_ENV === 'production' ? 80 : 30,
  
  // CDN 실패율 임계값 (%)
  // 로컬 환경: 30%, 프로덕션 환경: 10%
  CDN_FAILURE_RATE_THRESHOLD: process.env.NODE_ENV === 'production' ? 10 : 30,
  
  // 타임아웃 설정 (ms)
  API_TIMEOUT: 10000,
  CDN_TIMEOUT: 8000,
  STORAGE_TIMEOUT: 15000
};

export interface DatabaseStatus {
  isConnected: boolean;
  responseTime: number;
  error?: string;
  lastChecked: Date;
}

export interface StorageStatus {
  totalUsed: number;
  totalLimit: number;
  usagePercentage: number;
  error?: string;
  lastChecked: Date;
}

export interface ApiStatus {
  responseTime: number;
  isHealthy: boolean;
  error?: string;
  lastChecked: Date;
}

export interface CdnStatus {
  averageLoadTime: number;
  isHealthy: boolean;
  error?: string;
  lastChecked: Date;
}

/**
 * 데이터베이스 연결 상태를 확인합니다
 */
export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
  const startTime = Date.now();
  
  try {
    // 간단한 쿼리로 연결 상태 확인
    const { data, error } = await supabase
      .from('images')
      .select('id')
      .limit(1);
    
    const responseTime = Date.now() - startTime;
    
    if (error) {
      return {
        isConnected: false,
        responseTime,
        error: error.message,
        lastChecked: new Date()
      };
    }
    
    return {
      isConnected: true,
      responseTime,
      lastChecked: new Date()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      isConnected: false,
      responseTime,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      lastChecked: new Date()
    };
  }
}

/**
 * 스토리지 사용량을 확인합니다 (개선된 버전)
 */
export async function checkStorageStatus(): Promise<StorageStatus> {
  try {
    // 방법 1: SQL을 통한 정확한 스토리지 사용량 조회
    const { data: storageData, error: sqlError } = await supabase
      .rpc('get_storage_usage');
    
    if (!sqlError && storageData) {
      // RPC 함수가 있는 경우 사용
      return {
        totalUsed: storageData.total_size || 0,
        totalLimit: storageData.total_limit || (1 * 1024 * 1024 * 1024), // 1GB 기본값
        usagePercentage: storageData.usage_percentage || 0,
        lastChecked: new Date()
      };
    }
    
    // 방법 2: 직접 SQL 쿼리로 스토리지 사용량 조회
    try {
      const { data: directStorageData, error: directError } = await supabase
        .from('storage.objects')
        .select('metadata')
        .not('metadata->size', 'is', null);
      
      if (!directError && directStorageData && directStorageData.length > 0) {
        let totalUsed = 0;
        let fileCount = 0;
        
        for (const obj of directStorageData) {
          const size = obj.metadata?.size;
          if (typeof size === 'number' && size > 0) {
            totalUsed += size;
            fileCount++;
          }
        }
        
        // Supabase 무료 플랜: 1GB 스토리지
        const totalLimit = 1 * 1024 * 1024 * 1024; // 1GB
        const usagePercentage = (totalUsed / totalLimit) * 100;
        
        console.log('SQL 쿼리로 조회한 스토리지 사용량:', {
          totalUsed,
          fileCount,
          usagePercentage
        });
        
        return {
          totalUsed,
          totalLimit,
          usagePercentage,
          lastChecked: new Date()
        };
      }
    } catch (sqlError) {
      console.warn('SQL 쿼리로 스토리지 조회 실패:', sqlError);
    }
    
    // 방법 3: Storage API를 통한 대략적인 사용량 조회 (fallback)
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      return {
        totalUsed: 0,
        totalLimit: 1 * 1024 * 1024 * 1024, // 1GB
        usagePercentage: 0,
        error: error.message,
        lastChecked: new Date()
      };
    }
    
    let totalUsed = 0;
    let fileCount = 0;
    
    // 각 버킷의 파일들을 확인하여 실제 사용량 계산
    for (const bucket of buckets) {
      try {
        // 루트 레벨 파일들만 조회 (성능 최적화)
        const { data: files, error: listError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 });
        
        if (listError || !files) {
          console.warn(`버킷 ${bucket.name} 파일 목록 조회 실패:`, listError);
          continue;
        }
        
        console.log(`버킷 ${bucket.name}에서 ${files.length}개 파일 발견`);
        
        // 파일 크기 합계 계산
        for (const file of files) {
          if (file.metadata && file.metadata.size && file.name !== '.emptyFolderPlaceholder') {
            totalUsed += file.metadata.size;
            fileCount++;
            console.log(`파일: ${file.name}, 크기: ${file.metadata.size} bytes`);
          }
        }
      } catch (bucketError) {
        console.warn(`버킷 ${bucket.name} 조회 실패:`, bucketError);
      }
    }
    
    // 방법 4: 이미지 테이블을 통한 대략적인 사용량 추정
    if (totalUsed === 0) {
      try {
        const { data: images, error: imagesError } = await supabase
          .from('images')
          .select('url, file_name');
        
        if (!imagesError && images && images.length > 0) {
          // 이미지 개수 기반으로 대략적인 사용량 추정
          // 평균 이미지 크기를 500KB로 가정
          const averageImageSize = 500 * 1024; // 500KB
          totalUsed = images.length * averageImageSize;
          fileCount = images.length;
          
          console.log(`이미지 테이블 기반 추정: ${images.length}개 이미지, 추정 크기: ${totalUsed} bytes`);
        }
      } catch (imagesError) {
        console.warn('이미지 테이블 조회 실패:', imagesError);
      }
    }
    
    // Supabase 무료 플랜: 1GB 스토리지
    const totalLimit = 1 * 1024 * 1024 * 1024; // 1GB
    const usagePercentage = (totalUsed / totalLimit) * 100;
    
    console.log('최종 스토리지 사용량 계산:', {
      totalUsed,
      fileCount,
      usagePercentage,
      method: totalUsed > 0 ? 'Storage API' : '이미지 테이블 추정'
    });
    
    return {
      totalUsed,
      totalLimit,
      usagePercentage,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      totalUsed: 0,
      totalLimit: 1 * 1024 * 1024 * 1024, // 1GB
      usagePercentage: 0,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      lastChecked: new Date()
    };
  }
}

/**
 * API 응답 시간을 측정합니다
 */
export async function checkApiStatus(): Promise<ApiStatus> {
  const startTime = Date.now();
  
  try {
    // 여러 API 엔드포인트를 테스트하여 평균 응답 시간 측정
    const apiTests = [
      // 1. 이미지 테이블 조회
      supabase.from('images').select('id').limit(1),
      // 2. 카테고리 테이블 조회
      supabase.from('categories').select('id').limit(1),
      // 3. 사용자 테이블 조회 (있다면) - Promise로 래핑
      new Promise(async (resolve) => {
        try {
          const result = await supabase.from('users').select('id').limit(1);
          resolve(result);
        } catch (error) {
          resolve(null);
        }
      })
    ];
    
    const results = await Promise.allSettled(apiTests);
    const responseTime = Date.now() - startTime;
    
    // 성공한 요청 수 계산
    const successfulRequests = results.filter(result => 
      result.status === 'fulfilled' && 
      result.value && 
      !result.value.error
    ).length;
    
    // 설정된 성공률 임계값 이상 성공하면 정상으로 간주
    const successRate = (successfulRequests / apiTests.length) * 100;
    const isHealthy = successRate >= MONITORING_CONFIG.API_SUCCESS_RATE_THRESHOLD;
    
    // 응답 시간이 설정된 임계값 이상이면 경고
    const isResponseTimeHealthy = responseTime < MONITORING_CONFIG.API_RESPONSE_TIME_ERROR;
    const finalIsHealthy = isHealthy && isResponseTimeHealthy;
    
    let errorMessage = '';
    if (!isHealthy) {
      errorMessage = `${apiTests.length - successfulRequests}개 API 엔드포인트 실패`;
    }
    if (!isResponseTimeHealthy) {
      errorMessage += errorMessage ? ', ' : '';
      errorMessage += '응답 시간 지연';
    }
    
    return {
      responseTime,
      isHealthy: finalIsHealthy,
      error: errorMessage || undefined,
      lastChecked: new Date()
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      responseTime,
      isHealthy: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      lastChecked: new Date()
    };
  }
}

/**
 * CDN 상태를 확인합니다 (이미지 로딩 시간 측정)
 */
export async function checkCdnStatus(): Promise<CdnStatus> {
  try {
    // 여러 이미지를 가져와서 평균 로딩 시간 측정
    const { data: images, error } = await supabase
      .from('images')
      .select('url')
      .limit(3); // 3개 이미지로 테스트
    
    if (error || !images || images.length === 0) {
      return {
        averageLoadTime: 0,
        isHealthy: false,
        error: error?.message || '이미지가 없습니다',
        lastChecked: new Date()
      };
    }
    
    // 여러 이미지의 로딩 시간을 병렬로 측정
    const loadTimePromises = images.map((image) => {
      return new Promise<number>((resolve) => {
        const startTime = Date.now();
        const img = new Image();
        
        img.onload = () => {
          const loadTime = Date.now() - startTime;
          resolve(loadTime);
        };
        
        img.onerror = () => {
          resolve(5000); // 실패 시 5초로 간주
        };
        
        // 타임아웃 설정 (8초)
        setTimeout(() => {
          resolve(8000);
        }, 8000);
        
        img.src = image.url;
      });
    });
    
    const loadTimes = await Promise.all(loadTimePromises);
    
    // 평균 로딩 시간 계산
    const averageLoadTime = loadTimes.reduce((sum, time) => sum + time, 0) / loadTimes.length;
    
    // 실패한 이미지 수 계산 (5초 이상 로딩된 경우)
    const failedImages = loadTimes.filter(time => time >= 5000).length;
    
    // 설정된 실패율 임계값 이상 실패하거나 평균 로딩 시간이 설정된 임계값 이상이면 비정상
    const failureRate = (failedImages / loadTimes.length) * 100;
    const isHealthy = failureRate < MONITORING_CONFIG.CDN_FAILURE_RATE_THRESHOLD && 
                     averageLoadTime < MONITORING_CONFIG.CDN_LOAD_TIME_ERROR;
    
    let errorMessage = '';
    if (failureRate >= MONITORING_CONFIG.CDN_FAILURE_RATE_THRESHOLD) {
      errorMessage = `${failedImages}개 이미지 로딩 실패`;
    }
    if (averageLoadTime >= MONITORING_CONFIG.CDN_LOAD_TIME_ERROR) {
      errorMessage += errorMessage ? ', ' : '';
      errorMessage += '평균 로딩 시간 지연';
    }
    
    return {
      averageLoadTime,
      isHealthy,
      error: errorMessage || undefined,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      averageLoadTime: 0,
      isHealthy: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      lastChecked: new Date()
    };
  }
}

/**
 * 파일 크기를 사람이 읽기 쉬운 형태로 변환합니다
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 응답 시간을 사람이 읽기 쉬운 형태로 변환합니다
 */
export function formatResponseTime(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  } else {
    return `${(ms / 1000).toFixed(1)}s`;
  }
}

/**
 * 전체 시스템 상태를 한 번에 확인합니다
 */
export async function checkAllSystemStatus() {
  const startTime = Date.now();
  
  try {
    const [dbStatus, storageStatus, apiStatus, cdnStatus] = await Promise.allSettled([
      checkDatabaseStatus(),
      checkStorageStatus(),
      checkApiStatus(),
      checkCdnStatus()
    ]);
    
    const totalCheckTime = Date.now() - startTime;
    
    return {
      database: dbStatus.status === 'fulfilled' ? dbStatus.value : null,
      storage: storageStatus.status === 'fulfilled' ? storageStatus.value : null,
      api: apiStatus.status === 'fulfilled' ? apiStatus.value : null,
      cdn: cdnStatus.status === 'fulfilled' ? cdnStatus.value : null,
      totalCheckTime,
      lastChecked: new Date()
    };
  } catch (error) {
    return {
      database: null,
      storage: null,
      api: null,
      cdn: null,
      totalCheckTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : '알 수 없는 오류',
      lastChecked: new Date()
    };
  }
}

/**
 * 시스템 상태 설정을 내보냅니다
 */
export { MONITORING_CONFIG };