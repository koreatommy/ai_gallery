'use client';

import AdminLayout from '@/components/admin/AdminLayout';
import FooterManagement from '@/components/admin/FooterManagement';

export default function FooterManagementPage() {
  return (
    <AdminLayout 
      title="풋터관리" 
      description="사이트 풋터 관리"
    >
      <FooterManagement />
    </AdminLayout>
  );
}
