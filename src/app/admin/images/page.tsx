'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ImageManagement from '@/components/admin/ImageManagement';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminAuth } from '@/lib/admin';
import { Shield } from 'lucide-react';

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
    <AdminLayout title="이미지 관리" description="업로드된 이미지들을 관리하고 편집할 수 있습니다">
      <ImageManagement />
    </AdminLayout>
  );
}