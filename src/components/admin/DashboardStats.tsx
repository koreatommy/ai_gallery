'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Eye, 
  Clock, 
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { imageService, categoryService } from '@/lib/database';
import type { Image, Category } from '@/types';

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
  dailyStats: Array<{
    date: string;
    uploads: number;
    likes: number;
  }>;
  categoryDistribution: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
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
      const [images, categories] = await Promise.all([
        imageService.getAll(100, 0),
        categoryService.getAll()
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

      // 일별 통계 (최근 7일)
      const dailyStats = generateDailyStats(images);

      const newStats: StatsData = {
        totalImages: images.length,
        totalCategories: categories.length,
        totalLikes,
        totalComments,
        recentUploads,
        popularCategories,
        topImages,
        dailyStats,
        categoryDistribution
      };

      setPreviousStats(stats);
      setStats(newStats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDailyStats = (images: Image[]) => {
    const days = 7;
    const dailyStats = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayImages = images.filter(img => 
        img.created_at.startsWith(dateStr)
      );
      
      const dayLikes = dayImages.reduce((sum, img) => sum + img.likes_count, 0);
      
      dailyStats.push({
        date: dateStr,
        uploads: dayImages.length,
        likes: dayLikes
      });
    }
    
    return dailyStats;
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
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

      {/* 일별 통계 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">최근 7일 활동</h2>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {stats.dailyStats.map((day, index) => (
            <div key={day.date} className="text-center">
              <p className="text-xs text-gray-500 mb-2">{formatDate(day.date)}</p>
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Activity className="w-3 h-3 text-blue-500" />
                  <span className="text-sm font-medium">{day.uploads}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <Users className="w-3 h-3 text-red-500" />
                  <span className="text-sm font-medium">{day.likes}</span>
                </div>
              </div>
            </div>
          ))}
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
