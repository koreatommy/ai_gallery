'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MasonryGallery from './MasonryGallery';
import ImageLightbox from './ImageLightbox';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
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
    isLoadingMore,
    isError,
    error,
    hasMore,
    loadMore,
    refresh
  } = useInfiniteScroll({
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
      <MasonryGallery
        images={images}
        loading={isLoading && images.length === 0}
        onImageClick={handleImageClick}
        onLikeToggle={handleLikeToggle}
      />

      {/* 더 보기 버튼 또는 로딩 */}
      {isLoadingMore && (
        <div className="flex justify-center py-8">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-blue-600">더 많은 이미지를 불러오는 중...</span>
          </div>
        </div>
      )}

      {!isLoading && !isLoadingMore && hasMore && images.length > 0 && (
        <div className="flex justify-center py-8">
          <Button onClick={loadMore} variant="outline" className="bg-white hover:bg-gray-50">
            더 보기
          </Button>
        </div>
      )}

      {!isLoading && !isLoadingMore && !hasMore && images.length > 0 && (
        <div className="text-center py-8 text-gray-500">
          <div className="inline-flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
            <span>모든 이미지를 불러왔습니다</span>
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