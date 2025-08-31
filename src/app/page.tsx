'use client';

import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Search, Upload, Grid3X3, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import InfiniteScrollGallery from '@/components/gallery/InfiniteScrollGallery';
import ImageUploader from '@/components/gallery/ImageUploader';
import CategoryFilter from '@/components/gallery/CategoryFilter';
import SearchBar from '@/components/gallery/SearchBar';
import HeroSection from '@/components/layout/HeroSection';
import PopularRanking from '@/components/gallery/PopularRanking';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { categoryService } from '@/lib/database';
import type { Category } from '@/types';
import { toast } from 'sonner';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const queryClient = useQueryClient();
  const router = useRouter();

  // 카테고리 로드
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
      }
    };
    loadCategories();
  }, []);

  const handleUploadComplete = (results: Array<{ url: string; thumbnailUrl: string; fileName: string; fileSize: number; width?: number; height?: number }>) => {
    setIsUploadDialogOpen(false);
    toast.success(`${results.length}개 이미지 업로드가 완료되었습니다!`);
    // 갤러리 캐시 무효화하여 새로고침
    queryClient.invalidateQueries({ queryKey: ['images'] });
  };

  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setSearchQuery(''); // 카테고리 변경시 검색어 초기화
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setSelectedCategory(''); // 검색시 카테고리 초기화
  };

  const handleAdminLogin = () => {
    router.push('/admin');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* 헤더 */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* 로고 */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Gallery
              </h1>
            </div>

            {/* 검색바 */}
            <div className="flex-1 max-w-2xl mx-8">
              <SearchBar onSearch={handleSearch} />
            </div>

            {/* 액션 버튼들 */}
            <div className="flex items-center space-x-3">
              <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    업로드
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>이미지 업로드</DialogTitle>
                  </DialogHeader>
                  <ImageUploader onUploadComplete={handleUploadComplete} />
                </DialogContent>
              </Dialog>
              
              {/* 관리자 로그인 버튼 */}
              <Button 
                variant="outline"
                onClick={handleAdminLogin}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                <Shield className="w-4 h-4 mr-2" />
                관리자
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* 히어로 섹션 */}
      <HeroSection onUploadClick={() => setIsUploadDialogOpen(true)} />

      {/* 메인 콘텐츠 */}
      <main id="gallery-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 필터 섹션 */}
        <div className="mb-8">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        {/* 검색 결과 표시 */}
        {(searchQuery || selectedCategory) && (
          <div className="mb-6">
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-800">
                    {searchQuery && `"${searchQuery}" 검색 결과`}
                    {selectedCategory && categories.find(c => c.id === selectedCategory)?.name && 
                      `${categories.find(c => c.id === selectedCategory)?.name} 카테고리`}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('');
                  }}
                  className="text-blue-600 hover:text-blue-800"
                >
                  필터 초기화
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* 인기 작품 랭킹 - 필터가 없을 때만 표시 */}
        {!searchQuery && !selectedCategory && (
          <div className="mb-12">
            <PopularRanking />
          </div>
        )}

        {/* 갤러리 */}
        <InfiniteScrollGallery
          searchQuery={searchQuery}
          categoryId={selectedCategory}
        />
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="text-sm">
              © 2025 AI Gallery. 생성형 AI 이미지를 공유하고 발견하세요.
            </p>
            <div className="flex items-center justify-center space-x-6 mt-4 text-xs text-gray-500">
              <span>Next.js + Supabase</span>
              <span>•</span>
              <span>TypeScript</span>
              <span>•</span>
              <span>Tailwind CSS</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
