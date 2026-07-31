'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Masonry from 'react-masonry-css';
import { MessageCircle, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import { useLikes } from '@/hooks/useLikes';
import { getAspectRatioStyle, isPortrait } from '@/lib/imageOrientation';
import type { Image } from '@/types';

interface MasonryGalleryProps {
  images: Image[];
  loading?: boolean;
  onImageClick?: (image: Image) => void;
  onLikeToggle?: (imageId: string) => void;
}

const breakpointColumns = {
  default: 4,
  1200: 3,
  768: 2,
  480: 1
};

export default function MasonryGallery({
  images,
  loading,
  onImageClick,
  onLikeToggle
}: MasonryGalleryProps) {
  const [imageLoadStates, setImageLoadStates] = useState<Record<string, boolean>>({});
  const [naturalSizes, setNaturalSizes] = useState<Record<string, { width: number; height: number }>>({});
  const { isLiked, setMultipleImageLikeCounts } = useLikes();

  const handleImageLoad = (imageId: string, e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageLoadStates(prev => ({ ...prev, [imageId]: true }));
    if (img.naturalWidth && img.naturalHeight) {
      setNaturalSizes(prev => ({
        ...prev,
        [imageId]: { width: img.naturalWidth, height: img.naturalHeight },
      }));
    }
  };

  const handleImageClick = (image: Image) => {
    onImageClick?.(image);
  };

  useEffect(() => {
    if (images.length > 0) {
      const likeCounts: Record<string, number> = {};
      images.forEach(image => {
        likeCounts[image.id] = image.likes_count;
      });
      setMultipleImageLikeCounts(likeCounts);
    }
  }, [images, setMultipleImageLikeCounts]);

  const handleLikeToggle = async (imageId: string, _newCount?: number, _isLiked?: boolean) => {
    onLikeToggle?.(imageId);
  };

  if (loading) {
    return (
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <div key={index} className="mb-4">
            <Card className="overflow-hidden py-0 gap-0">
              <Skeleton className="w-full h-64" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          </div>
        ))}
      </Masonry>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <Eye className="h-16 w-16 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-600 mb-2">아직 이미지가 없습니다</h3>
        <p className="text-gray-500">첫 번째 이미지를 업로드해보세요!</p>
      </div>
    );
  }

  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumns}
        className="masonry-grid"
        columnClassName="masonry-grid-column"
      >
        {images.map((image, index) => {
          const measured = naturalSizes[image.id];
          const w = measured?.width || image.width;
          const h = measured?.height || image.height;
          const aspect = getAspectRatioStyle(w, h);
          const portrait = isPortrait(w, h);

          return (
            <motion.div
              key={image.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              className="mb-4"
            >
              <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer py-0 gap-0">
                <div
                  className="relative overflow-hidden bg-muted/20"
                  onClick={() => handleImageClick(image)}
                >
                  <div className="relative">
                    {!imageLoadStates[image.id] && (
                      <Skeleton
                        className="w-full"
                        style={{ aspectRatio: aspect || (portrait ? '3 / 4' : '4 / 3') }}
                      />
                    )}
                    <img
                      src={image.url}
                      alt={image.title}
                      className={`
                        block w-full h-auto transition-opacity duration-300
                        ${imageLoadStates[image.id] ? 'opacity-100' : 'opacity-0 absolute inset-0'}
                      `}
                      onLoad={(e) => handleImageLoad(image.id, e)}
                      loading="lazy"
                    />
                  </div>

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <div className="flex items-center space-x-4 text-white">
                      <LikeButton
                        imageId={image.id}
                        initialCount={image.likes_count}
                        initialLiked={isLiked(image.id)}
                        onToggle={handleLikeToggle}
                        size="md"
                        variant="ghost"
                      />
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="h-5 w-5" />
                        <span>{image.comments_count || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-medium text-lg mb-1 line-clamp-2">
                    {image.title}
                  </h3>

                  {image.description && !image.description.includes('업로드된 이미지:') && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                      {image.description}
                    </p>
                  )}

                  {image.tags && image.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {image.tags.slice(0, 3).map((tag, tagIndex) => (
                        <Badge key={tagIndex} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {image.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{image.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-500 flex items-center space-x-2">
                      {image.author && (
                        <>
                          <span>{image.author}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>{new Date(image.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <LikeButton
                        imageId={image.id}
                        initialCount={image.likes_count}
                        initialLiked={isLiked(image.id)}
                        onToggle={handleLikeToggle}
                        size="sm"
                        variant="ghost"
                      />

                      <div onClick={(e) => e.stopPropagation()}>
                        <ShareButton
                          image={image}
                          size="sm"
                          variant="ghost"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </Masonry>

      <style jsx global>{`
        .masonry-grid {
          display: flex;
          margin-left: -16px;
          width: auto;
        }

        .masonry-grid-column {
          padding-left: 16px;
          background-clip: padding-box;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}
