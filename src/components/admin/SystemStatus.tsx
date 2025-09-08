'use client';

import { useState, useEffect } from 'react';
import { 
  Server, 
  Database, 
  HardDrive, 
  Cpu, 
  Wifi, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import { 
  checkDatabaseStatus, 
  checkStorageStatus, 
  checkApiStatus, 
  checkCdnStatus,
  formatBytes,
  formatResponseTime,
  type DatabaseStatus,
  type StorageStatus,
  type ApiStatus,
  type CdnStatus
} from '@/lib/systemMonitor';

interface SystemStatusItem {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'error';
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export default function SystemStatus() {
  const [statusItems, setStatusItems] = useState<SystemStatusItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadSystemStatus();
    // 30초마다 상태 업데이트
    const interval = setInterval(loadSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadSystemStatus = async () => {
    setIsLoading(true);
    try {
      // 실제 시스템 상태를 병렬로 확인
      const [dbStatus, storageStatus, apiStatus, cdnStatus] = await Promise.all([
        checkDatabaseStatus(),
        checkStorageStatus(),
        checkApiStatus(),
        checkCdnStatus()
      ]);

      const statusItems: SystemStatusItem[] = [
        {
          id: 'database',
          name: '데이터베이스',
          status: dbStatus.isConnected ? 'healthy' : 'error',
          value: dbStatus.isConnected ? `응답 시간 ${formatResponseTime(dbStatus.responseTime)}` : '연결 실패',
          description: dbStatus.isConnected 
            ? 'Supabase 연결 정상' 
            : dbStatus.error || '데이터베이스 연결 실패',
          icon: Database
        },
        {
          id: 'storage',
          name: '스토리지',
          status: storageStatus.usagePercentage > 90 ? 'error' : 
                  storageStatus.usagePercentage > 80 ? 'warning' : 'healthy',
          value: `${formatBytes(storageStatus.totalUsed)} / ${formatBytes(storageStatus.totalLimit)}`,
          description: storageStatus.error || 
            (storageStatus.usagePercentage > 90 ? '용량 부족 위험' : 
             storageStatus.usagePercentage > 80 ? '용량 부족 경고' : '사용 가능한 용량 충분'),
          icon: HardDrive
        },
        {
          id: 'api',
          name: 'API 서버',
          status: apiStatus.isHealthy ? 'healthy' : 'warning',
          value: `응답 시간 ${formatResponseTime(apiStatus.responseTime)}`,
          description: apiStatus.error || 
            (apiStatus.isHealthy ? '정상 응답 중' : '응답 시간 지연'),
          icon: Server
        },
        {
          id: 'cdn',
          name: 'CDN',
          status: cdnStatus.isHealthy ? 'healthy' : 'warning',
          value: `로딩 시간 ${formatResponseTime(cdnStatus.averageLoadTime)}`,
          description: cdnStatus.error || 
            (cdnStatus.isHealthy ? '정상 로딩' : '로딩 지연 발생'),
          icon: Wifi
        }
      ];

      setStatusItems(statusItems);
      setLastUpdated(new Date());
      
      // 디버깅을 위한 콘솔 로그
      console.log('시스템 상태 디버깅:', {
        database: { status: dbStatus.isConnected ? 'healthy' : 'error', responseTime: dbStatus.responseTime },
        storage: { status: storageStatus.usagePercentage > 90 ? 'error' : storageStatus.usagePercentage > 80 ? 'warning' : 'healthy', usage: storageStatus.usagePercentage },
        api: { status: apiStatus.isHealthy ? 'healthy' : 'warning', responseTime: apiStatus.responseTime },
        cdn: { status: cdnStatus.isHealthy ? 'healthy' : 'warning', loadTime: cdnStatus.averageLoadTime }
      });
    } catch (error) {
      console.error('시스템 상태 로드 실패:', error);
      // 오류 발생 시 기본 상태 설정
      setStatusItems([
        {
          id: 'database',
          name: '데이터베이스',
          status: 'error',
          value: '확인 실패',
          description: '상태 확인 중 오류 발생',
          icon: Database
        },
        {
          id: 'storage',
          name: '스토리지',
          status: 'error',
          value: '확인 실패',
          description: '상태 확인 중 오류 발생',
          icon: HardDrive
        },
        {
          id: 'api',
          name: 'API 서버',
          status: 'error',
          value: '확인 실패',
          description: '상태 확인 중 오류 발생',
          icon: Server
        },
        {
          id: 'cdn',
          name: 'CDN',
          status: 'error',
          value: '확인 실패',
          description: '상태 확인 중 오류 발생',
          icon: Wifi
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: SystemStatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: SystemStatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return 'border-green-200 bg-green-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'error':
        return 'border-red-200 bg-red-50';
    }
  };

  const getStatusTextColor = (status: SystemStatusItem['status']) => {
    switch (status) {
      case 'healthy':
        return 'text-green-700';
      case 'warning':
        return 'text-yellow-700';
      case 'error':
        return 'text-red-700';
    }
  };

  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">시스템 상태</h2>
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3 p-3 rounded-lg border">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">시스템 상태</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {formatLastUpdated(lastUpdated)} 업데이트
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={loadSystemStatus}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-3">
        {statusItems.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${getStatusColor(item.status)}`}
            >
              <div className="flex-shrink-0">
                <Icon className={`w-5 h-5 ${getStatusTextColor(item.status)}`} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`font-medium text-sm ${getStatusTextColor(item.status)}`}>
                    {item.name}
                  </p>
                  {getStatusIcon(item.status)}
                </div>
                <p className="text-xs text-gray-600 mt-0.5">
                  {item.description}
                </p>
              </div>
              
              <div className="flex-shrink-0 text-right">
                <p className={`text-sm font-medium ${getStatusTextColor(item.status)}`}>
                  {item.value}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 전체 상태 요약 */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">전체 상태</span>
          <div className="flex items-center gap-2">
            {statusItems.every(item => item.status === 'healthy') ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">정상</span>
              </>
            ) : statusItems.some(item => item.status === 'error') ? (
              <>
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600 font-medium">오류</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-4 h-4 text-yellow-500" />
                <span className="text-sm text-yellow-600 font-medium">주의</span>
              </>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
