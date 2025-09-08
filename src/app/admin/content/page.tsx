'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function ContentManagementPage() {
  return (
    <AdminLayout 
      title="컨텐츠관리" 
      description="컨텐츠 생성 및 관리"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            컨텐츠 관리
          </h2>
          <p className="text-gray-600">
            컨텐츠 관리 기능이 곧 추가될 예정입니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
