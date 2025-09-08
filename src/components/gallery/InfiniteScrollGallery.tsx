'use client';

import { useState } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MasonryGallery from './MasonryGallery';
import ImageLightbox from './ImageLightbox';
import { usePagination } from '@/hooks/useInfiniteScroll';
import { likeService } from '@/lib/database';
import type { Image } from '@/types';
import { toast } from 'sonner';

interface InfiniteScrollGalleryProps {
  searchQuery?: string;
  categoryId?: string;
}

export default function InfiniteScrollGallery({
  searchQuery,
  categoryId
}: InfiniteScrollGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const {
    images,
    isLoading,
    isError,
    error,
    refresh,
    currentPage,
    totalCount,
    totalPages,
    limit,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage,
    hasPrevPage
  } = usePagination({
    searchQuery,
    categoryId,
    limit: 20
  });

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
    setIsLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);
    setSelectedImage(null);
  };

  const handleNextImage = () => {
    if (!selectedImage) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex < images.length - 1) {
      setSelectedImage(images[currentIndex + 1]);
    }
  };

  const handlePreviousImage = () => {
    if (!selectedImage) return;
    
    const currentIndex = images.findIndex(img => img.id === selectedImage.id);
    if (currentIndex > 0) {
      setSelectedImage(images[currentIndex - 1]);
    }
  };

  const handleLikeToggle = async (imageId: string) => {
    try {
      // 익명 사용자용 고정 UUID 사용
      const anonymousUserId = '00000000-0000-0000-0000-000000000000';
      const isLiked = await likeService.toggle(imageId, anonymousUserId);
      
      // 선택된 이미지 카운트 업데이트 (라이트박스에서만 필요)
      if (selectedImage && selectedImage.id === imageId) {
        setSelectedImage({
          ...selectedImage,
          likes_count: isLiked ? selectedImage.likes_count + 1 : selectedImage.likes_count - 1
        });
      }
      
      toast.success(isLiked ? '좋아요를 눌렀습니다' : '좋아요를 취소했습니다');
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      toast.error('좋아요 처리에 실패했습니다');
    }
  };

  if (isError) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          이미지를 불러오는데 실패했습니다.
        </div>
        <p className="text-gray-600 mb-4">
          {error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.'}
        </p>
        <Button onClick={refresh}>
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* 페이징 정보 표시 */}
      {!searchQuery && !categoryId && totalCount > 0 && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{totalCount.toLocaleString()}</span>개의 작품
              </div>
              <div className="text-sm text-gray-500">
                페이지 {currentPage} / {totalPages}
              </div>
              <div className="text-sm text-gray-500">
                현재 {images.length}개 표시 중
              </div>
            </div>
            <div className="text-sm text-gray-500">
              한 페이지당 {limit}개씩 로드
            </div>
          </div>
        </div>
      )}

      <MasonryGallery
        images={images}
        loading={isLoading && images.length === 0}
        onImageClick={handleImageClick}
        onLikeToggle={handleLikeToggle}
      />

      {/* 페이징 UI */}
      {!searchQuery && !categoryId && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 py-8">
          {/* 이전 페이지 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={!hasPrevPage}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </Button>

          {/* 페이지 번호들 */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }

              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNum)}
                  className={`w-10 h-10 ${
                    currentPage === pageNum
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-white hover:bg-gray-50"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          {/* 다음 페이지 버튼 */}
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={!hasNextPage}
            className="flex items-center gap-1"
          >
            다음
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* 검색/필터 결과일 때는 페이징 숨김 */}
      {(searchQuery || categoryId) && images.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>{images.length}개의 결과를 찾았습니다</span>
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      )}

      {/* 라이트박스 */}
      <ImageLightbox
        image={selectedImage}
        images={images}
        isOpen={isLightboxOpen}
        onClose={handleCloseLightbox}
        onNext={handleNextImage}
        onPrevious={handlePreviousImage}
        onLikeToggle={handleLikeToggle}
      />
    </div>
  );
}