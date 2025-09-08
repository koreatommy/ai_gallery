'use client';

import { useState, useEffect } from 'react';
import AdminDashboard from '@/components/admin/AdminDashboard';
import AdminLayout from '@/components/admin/AdminLayout';
import { AdminAuth } from '@/lib/admin';
import { Shield, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (AdminAuth.login(password)) {
      setIsAuthenticated(true);
    } else {
      setError('잘못된 비밀번호입니다.');
    }
    
    setIsLoading(false);
  };

  const handleLogout = () => {
    AdminAuth.logout();
    setIsAuthenticated(false);
    setPassword('');
  };

  // 페이지 로드 시 인증 상태 확인
  useEffect(() => {
    const authenticated = AdminAuth.isAuthenticated();
    setIsAuthenticated(authenticated);
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">관리자 인증</h1>
            <p className="text-gray-600">관리자 페이지에 접근하려면 비밀번호를 입력하세요</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="관리자 비밀번호를 입력하세요"
                required
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-md">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '인증 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              개발용 비밀번호: admin123
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <AdminLayout title="관리자 대시보드" description="AI Gallery 시스템 현황을 한눈에 확인하세요">
      <AdminDashboard />
    </AdminLayout>
  );
}