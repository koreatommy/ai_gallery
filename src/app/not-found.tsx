import { Metadata } from 'next';
import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없음 - AI Gallery',
  description: '요청하신 페이지를 찾을 수 없습니다.',
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-4">
            <Search className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">페이지를 찾을 수 없습니다</h2>
          <p className="text-gray-600 mb-6">
            요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/">
            <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
              <Home className="w-4 h-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
          
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            이전 페이지로
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>문제가 지속되면 관리자에게 문의해주세요.</p>
        </div>
      </Card>
    </div>
  );
}
