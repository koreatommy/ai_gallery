'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // 에러 로깅
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <AlertTriangle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">
            일시적인 문제가 발생했습니다. 잠시 후 다시 시도해주세요.
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-red-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm text-red-800 font-mono break-all">
                {error.message}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <Button 
            onClick={reset}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
          
          <Link href="/">
            <Button variant="outline" className="w-full">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>문제가 지속되면 페이지를 새로고침하거나 관리자에게 문의해주세요.</p>
        </div>
      </Card>
    </div>
  );
}
