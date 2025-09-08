'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminAuth } from '@/lib/admin';
import { Shield } from 'lucide-react';

export default function AdminAnalyticsPage() {
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

  return (
    <AdminLayout title="분석" description="사용자 활동 및 통계를 확인할 수 있습니다">
      <div className="space-y-6">
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Shield className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">분석 기능 개발 중</h3>
          <p className="text-gray-500">사용자 활동 분석 및 상세 통계 기능이 곧 추가될 예정입니다.</p>
        </div>
      </div>
    </AdminLayout>
  );
}
