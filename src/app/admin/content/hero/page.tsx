'use client';

import AdminLayout from '@/components/admin/AdminLayout';

export default function HeroSectionManagementPage() {
  return (
    <AdminLayout 
      title="히어로섹션관리" 
      description="메인 히어로 섹션 관리"
    >
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            히어로 섹션 관리
          </h2>
          <p className="text-gray-600">
            메인 페이지 히어로 섹션의 콘텐츠 및 디자인 관리 기능이 곧 추가될 예정입니다.
          </p>
        </div>
      </div>
    </AdminLayout>
  );
}
