'use client';

import { useState, useEffect } from 'react';
import { Trophy, Heart, Eye, Crown, Medal, Award } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { imageService } from '@/lib/database';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import type { Image } from '@/types';
import { toast } from 'sonner';

interface PopularRankingProps {
  onImageClick?: (image: Image) => void;
}

export default function PopularRanking({ onImageClick }: PopularRankingProps) {
  const [topImages, setTopImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const { getMobileThumbnailUrl } = useImageOptimization();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const loadTopImages = async () => {
      try {
        const data = await imageService.getTopLiked(3);
        setTopImages(data);
      } catch (error) {
        console.error('인기 이미지 로드 실패:', error);
        console.error('에러 타입:', typeof error);
        console.error('에러 메시지:', error instanceof Error ? error.message : '알 수 없는 에러');
        console.error('에러 스택:', error instanceof Error ? error.stack : '스택 없음');
        
        // 네트워크 에러인지 확인
        const isNetworkError = error instanceof Error && (
          error.message.includes('fetch failed') || 
          error.message.includes('network') ||
          error.message.includes('ECONNREFUSED') ||
          error.message.includes('ENOTFOUND')
        );
        
        // Supabase 연결 상태 확인
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')) {
          console.error('Supabase 환경 변수가 설정되지 않았습니다.');
          toast.error('데이터베이스 연결 설정이 필요합니다');
        } else if (isNetworkError) {
          console.error('네트워크 연결 문제가 발생했습니다.');
          toast.error('네트워크 연결을 확인해주세요');
        } else {
          toast.error('인기 이미지를 불러올 수 없습니다');
        }
      } finally {
        setLoading(false);
      }
    };

    loadTopImages();
  }, []);

  // 모바일 감지
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
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
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-yellow-500/25">
          1st
        </div>
      );
      case 1: return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-gray-300 to-gray-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-gray-500/25">
          2nd
        </div>
      );
      case 2: return (
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-amber-700 text-white text-xs font-bold px-2 py-1 rounded-full shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-amber-500/25">
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
              className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-[1.05] bg-white border-2 border-transparent hover:border-gradient-to-r hover:from-yellow-400 hover:to-orange-500 hover:shadow-[0_20px_50px_rgba(0,0,0,0.15)]"
              onClick={() => onImageClick?.(image)}
            >
              {/* 이미지 */}
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={isMobile ? getMobileThumbnailUrl(image.url, 400) : (image.thumbnail_url || image.url)}
                  alt={image.title}
                  className="w-full h-full object-cover transition-all duration-300 group-hover:scale-110 group-hover:brightness-110"
                  onError={(e) => {
                    // 이미지 로딩 실패 시 여러 fallback 시도
                    const target = e.target as HTMLImageElement;
                    const currentSrc = target.src;
                    
                    // 1차: 원본 URL로 시도
                    if (currentSrc !== image.url) {
                      target.src = image.url;
                      return;
                    }
                    
                    // 2차: 썸네일 URL로 시도
                    if (image.thumbnail_url && currentSrc !== image.thumbnail_url) {
                      target.src = image.thumbnail_url;
                      return;
                    }
                    
                    // 3차: 기본 플레이스홀더 이미지로 설정
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDQwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMDAgMTUwQzE3Ni45IDE1MCAxNTggMTY4LjkgMTU4IDE5MkMxNTggMjE1LjEgMTc2LjkgMjM0IDIwMCAyMzRDMjIzLjEgMjM0IDI0MiAyMTUuMSAyNDIgMTkyQzI0MiAxNjguOSAyMjMuMSAxNTAgMjAwIDE1MFoiIGZpbGw9IiM5Q0EzQUYiLz4KPHBhdGggZD0iTTE2MCAyODBIMjQwVjMwMEgxNjBWMjgwWiIgZmlsbD0iIzlDQTNBRiIvPgo8L3N2Zz4K';
                    target.alt = '이미지를 불러올 수 없습니다';
                  }}
                  loading="lazy"
                />
                
                {/* 호버 오버레이 효과 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* 호버 시 글로우 효과 */}
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* 랭킹 오버레이 */}
                <div className="absolute top-4 left-4 flex items-center gap-2 transition-all duration-300 group-hover:scale-110">
                  {getRankIcon(index)}
                  <span className="text-white font-bold text-lg drop-shadow-lg group-hover:drop-shadow-xl">
                    #{index + 1}
                  </span>
                </div>

                {/* 통계 오버레이 */}
                <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1 transition-all duration-300 group-hover:bg-black/70 group-hover:scale-105 group-hover:shadow-lg">
                  <Heart className="w-4 h-4 text-red-400 transition-colors duration-300 group-hover:text-red-300" />
                  <span className="text-white text-sm font-semibold">
                    {image.likes_count?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* 카드 정보 */}
              <div className="p-4 space-y-3 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-yellow-50/50 group-hover:to-orange-50/50">
                <div>
                  <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-all duration-300 group-hover:scale-[1.02]">
                    {image.title}
                  </h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-gray-400 text-sm">
                      {new Date(image.created_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
                
                {image.description && !image.description.includes('업로드된 이미지:') && (
                  <p className="text-gray-600 text-sm line-clamp-2">
                    {image.description}
                  </p>
                )}

                {/* 통계 정보 */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {image.author && (
                        <>
                          <span>{image.author}</span>
                          <span>•</span>
                        </>
                      )}
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