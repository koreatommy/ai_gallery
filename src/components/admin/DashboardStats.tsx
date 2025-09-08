'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  MessageSquare,
  Trash2,
  MoreHorizontal
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { imageService, categoryService, commentService } from '@/lib/database';
import type { Image, Category, Comment } from '@/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

interface DashboardStatsProps {
  selectedTimeRange: '7d' | '30d' | '90d';
}

interface StatsData {
  totalImages: number;
  totalCategories: number;
  totalLikes: number;
  totalComments: number;
  recentUploads: Image[];
  popularCategories: Array<{ category: Category; count: number }>;
  topImages: Image[];
  categoryDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  recentComments: Comment[];
}

export default function DashboardStats({ selectedTimeRange }: DashboardStatsProps) {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [previousStats, setPreviousStats] = useState<StatsData | null>(null);

  useEffect(() => {
    loadStats();
  }, [selectedTimeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const [images, categories, recentComments] = await Promise.all([
        imageService.getAll(100, 0),
        categoryService.getAll(),
        commentService.getRecent(10)
      ]);

      // 통계 계산
      const totalLikes = images.reduce((sum, img) => sum + img.likes_count, 0);
      const totalComments = images.reduce((sum, img) => sum + (img.comments_count || 0), 0);

      // 최근 업로드 (최신 10개)
      const recentUploads = images
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 10);

      // 인기 이미지 (좋아요 순)
      const topImages = images
        .sort((a, b) => b.likes_count - a.likes_count)
        .slice(0, 10);

      // 카테고리별 이미지 수
      const categoryMap = new Map<string, Category>();
      categories.forEach(cat => categoryMap.set(cat.id, cat));

      const categoryCounts = new Map<string, number>();
      images.forEach(img => {
        if (img.category_id) {
          categoryCounts.set(img.category_id, (categoryCounts.get(img.category_id) || 0) + 1);
        }
      });

      const popularCategories = Array.from(categoryCounts.entries())
        .map(([categoryId, count]) => ({
          category: categoryMap.get(categoryId)!,
          count
        }))
        .filter(item => item.category)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 카테고리 분포
      const categoryDistribution = Array.from(categoryCounts.entries())
        .map(([categoryId, count]) => ({
          name: categoryMap.get(categoryId)?.name || '알 수 없음',
          count,
          percentage: (count / images.length) * 100
        }))
        .sort((a, b) => b.count - a.count);

      const newStats: StatsData = {
        totalImages: images.length,
        totalCategories: categories.length,
        totalLikes,
        totalComments,
        recentUploads,
        popularCategories,
        topImages,
        categoryDistribution,
        recentComments
      };

      setPreviousStats(stats);
      setStats(newStats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };


  const getTrendIcon = (current: number, previous: number) => {
    if (current > previous) {
      return <ArrowUpRight className="w-4 h-4 text-green-500" />;
    } else if (current < previous) {
      return <ArrowDownRight className="w-4 h-4 text-red-500" />;
    }
    return null;
  };

  const getTrendColor = (current: number, previous: number) => {
    if (current > previous) return 'text-green-600';
    if (current < previous) return 'text-red-600';
    return 'text-gray-600';
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await commentService.delete(commentId);
      toast.success('댓글이 삭제되었습니다');
      // 통계 다시 로드
      loadStats();
    } catch (error) {
      console.error('댓글 삭제 실패:', error);
      toast.error('댓글 삭제에 실패했습니다');
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '방금 전';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}분 전`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}시간 전`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}일 전`;
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">통계 데이터를 불러올 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 이미지</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalImages)}</p>
              <div className="flex items-center gap-1 mt-1">
                {previousStats && getTrendIcon(stats.totalImages, previousStats.totalImages)}
                <p className={`text-xs ${previousStats ? getTrendColor(stats.totalImages, previousStats.totalImages) : 'text-gray-500'}`}>
                  +{stats.recentUploads.length} 최근 업로드
                </p>
              </div>
            </div>
            <div className="relative">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">카테고리</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalCategories)}</p>
              <div className="flex items-center gap-1 mt-1">
                {stats.popularCategories[0] && (
                  <p className="text-xs text-gray-500">
                    {stats.popularCategories[0].category.name} 인기
                  </p>
                )}
              </div>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 좋아요</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalLikes)}</p>
              <div className="flex items-center gap-1 mt-1">
                {previousStats && getTrendIcon(stats.totalLikes, previousStats.totalLikes)}
                <p className={`text-xs ${previousStats ? getTrendColor(stats.totalLikes, previousStats.totalLikes) : 'text-gray-500'}`}>
                  평균 {(stats.totalLikes / Math.max(stats.totalImages, 1)).toFixed(1)}개/이미지
                </p>
              </div>
            </div>
            <Users className="h-8 w-8 text-red-500" />
          </div>
        </Card>

        <Card className="p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">총 댓글</p>
              <p className="text-3xl font-bold text-gray-900">{formatNumber(stats.totalComments)}</p>
              <div className="flex items-center gap-1 mt-1">
                {previousStats && getTrendIcon(stats.totalComments, previousStats.totalComments)}
                <p className={`text-xs ${previousStats ? getTrendColor(stats.totalComments, previousStats.totalComments) : 'text-gray-500'}`}>
                  평균 {(stats.totalComments / Math.max(stats.totalImages, 1)).toFixed(1)}개/이미지
                </p>
              </div>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* 댓글 관리 섹션 */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">최근 댓글</h2>
            <Badge variant="secondary" className="ml-2">
              {stats.recentComments.length}개
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadStats}
            className="text-xs"
          >
            새로고침
          </Button>
        </div>
        
        <div className="space-y-3">
          {stats.recentComments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">최근 댓글이 없습니다</p>
            </div>
          ) : (
            stats.recentComments.map((comment) => (
              <div
                key={comment.id}
                className="flex items-start gap-3 p-4 rounded-lg border bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                {/* 이미지 썸네일 */}
                {comment.images && (
                  <div className="flex-shrink-0">
                    <img
                      src={comment.images.thumbnail_url}
                      alt={comment.images.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  </div>
                )}
                
                {/* 댓글 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {comment.images?.title || '알 수 없는 이미지'}
                      </p>
                      <p className="text-sm text-gray-700 mb-2 line-clamp-2">
                        {comment.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatTimeAgo(comment.created_at)}</span>
                        <span>•</span>
                        <span>사용자 ID: {comment.user_id.slice(0, 8)}...</span>
                      </div>
                    </div>
                    
                    {/* 관리 액션 */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* 댓글 통계 요약 */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {stats.totalComments}
              </p>
              <p className="text-xs text-gray-500">총 댓글</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {stats.recentComments.length}
              </p>
              <p className="text-xs text-gray-500">최근 댓글</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {stats.totalComments > 0 ? (stats.totalComments / stats.totalImages).toFixed(1) : '0'}
              </p>
              <p className="text-xs text-gray-500">평균 댓글/이미지</p>
            </div>
          </div>
        </div>
      </Card>

      {/* 카테고리 분포 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">카테고리 분포</h2>
        </div>
        
        <div className="space-y-3">
          {stats.categoryDistribution.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="font-medium text-gray-900">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-20 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-12 text-right">
                  {item.count}개
                </span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
