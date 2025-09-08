'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function FooterManagementPage() {
  return (
    <AdminLayout 
      title="풋터관리" 
      description="사이트 풋터 관리"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            풋터 관리
          </h2>
          <p className="text-gray-600">
            사이트 하단 풋터의 콘텐츠 및 링크 관리 기능이 곧 추가될 예정입니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
