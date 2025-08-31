'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageManagement from '@/components/admin/ImageManagement';
import { AdminAuth } from '@/lib/admin';
import { Shield, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AdminImagesPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const authenticated = AdminAuth.isAuthenticated();
    if (authenticated) {
      setIsAuthenticated(true);
    } else {
      router.push('/admin');
    }
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">인증이 필요합니다...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    AdminAuth.logout();
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Button
                onClick={() => router.push('/admin')}
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                대시보드로
              </Button>
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">이미지 관리</h1>
                <p className="text-xs text-gray-500">AI Gallery Admin</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <Button
                onClick={() => window.open('/', '_blank')}
                variant="ghost"
                size="sm"
              >
                사이트 보기
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
              >
                로그아웃
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ImageManagement />
      </main>
    </div>
  );
}