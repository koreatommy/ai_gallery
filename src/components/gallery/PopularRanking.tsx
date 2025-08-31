'use client';

import { useState, useEffect } from 'react';
import { Trophy, Heart, Eye, Crown, Medal, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { imageService } from '@/lib/database';
import type { Image } from '@/types';
import { toast } from 'sonner';

interface PopularRankingProps {
  onImageClick?: (image: Image) => void;
}

export default function PopularRanking({ onImageClick }: PopularRankingProps) {
  const [topImages, setTopImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTopImages = async () => {
      try {
        const data = await imageService.getTopLiked(3);
        setTopImages(data);
      } catch (error) {
        console.error('인기 이미지 로드 실패:', error);
        toast.error('인기 이미지를 불러올 수 없습니다');
      } finally {
        setLoading(false);
      }
    };

    loadTopImages();
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 0: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 1: return <Medal className="w-6 h-6 text-gray-400" />;
      case 2: return <Award className="w-6 h-6 text-amber-600" />;
      default: return <Trophy className="w-6 h-6 text-gray-500" />;
    }
  };

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 0: return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          1st
        </div>
      );
      case 1: return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-300 to-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          2nd
        </div>
      );
      case 2: return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg">
          3rd
        </div>
      );
      default: return null;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full animate-pulse" />
          <div>
            <div className="w-32 h-6 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="relative">
              <Card className="overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200" />
                <div className="p-4 space-y-2">
                  <div className="w-full h-4 bg-gray-200 rounded" />
                  <div className="w-2/3 h-4 bg-gray-200 rounded" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (topImages.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-500 mb-2">아직 인기 이미지가 없어요</h3>
        <p className="text-gray-400">첫 번째 좋아요를 받은 이미지가 여기에 표시됩니다!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 섹션 헤더 */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full shadow-lg">
          <Trophy className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">인기 작품 랭킹</h2>
          <p className="text-gray-600">가장 많은 사랑을 받은 작품들을 만나보세요</p>
        </div>
      </div>

      {/* 랭킹 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topImages.map((image, index) => (
          <div key={image.id} className="relative">
            {getRankBadge(index)}
            
            <Card 
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-[1.02] bg-white"
              onClick={() => onImageClick?.(image)}
            >
              {/* 이미지 */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={image.thumbnail_url || image.url}
                  alt={image.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                
                {/* 랭킹 오버레이 */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  {getRankIcon(index)}
                  <span className="text-white font-bold text-lg drop-shadow-lg">
                    #{index + 1}
                  </span>
                </div>

                {/* 통계 오버레이 */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-white text-sm font-semibold">
                    {image.likes_count?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* 카드 정보 */}
              <div className="p-4 space-y-3">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {image.title}
                  </h3>
                  {image.author && (
                    <p className="text-gray-500 text-sm mt-1">
                      by {image.author}
                    </p>
                  )}
                </div>
                
                {image.description && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {image.description}
                  </p>
                )}

                {/* 통계 정보 */}
                <div className="space-y-2">
                  {image.author && (
                    <div className="text-xs text-gray-500">
                      <span>작성자: {image.author}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{image.likes_count?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        <span>{image.comments_count?.toLocaleString() || 0}</span>
                      </div>
                    </div>
                  
                    <Badge 
                      variant="secondary"
                      className={
                        index === 0 ? 'bg-yellow-100 text-yellow-800' :
                        index === 1 ? 'bg-gray-100 text-gray-800' :
                        'bg-amber-100 text-amber-800'
                      }
                    >
                      {index === 0 ? '👑 1위' : index === 1 ? '🥈 2위' : '🥉 3위'}
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {/* 하단 메시지 */}
      <div className="text-center py-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
        <p className="text-gray-600 mb-2">
          💝 여러분의 좋아요가 작품에게 큰 힘이 됩니다
        </p>
        <p className="text-sm text-gray-500">
          마음에 드는 작품에 좋아요를 눌러보세요!
        </p>
      </div>
    </div>
  );
}