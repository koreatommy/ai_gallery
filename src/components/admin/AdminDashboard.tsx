'use client';

import { useState, useEffect } from 'react';
import { BarChart3, Image as ImageIcon, Upload, Users, TrendingUp, Calendar, Database, HardDrive, Eye } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { imageService, categoryService } from '@/lib/database';
import { storageService } from '@/lib/storage';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import DashboardStats from './DashboardStats';
import ActivityLog from './ActivityLog';
import SystemStatus from './SystemStatus';
import type { Image, Category } from '@/types';
import { toast } from 'sonner';

interface DashboardData {
  totalImages: number;
  totalCategories: number;
  totalLikes: number;
  totalComments: number;
  recentUploads: Image[];
  popularCategories: Array<{ category: Category; count: number }>;
  topImages: Image[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  // 이미지 최적화 훅
  const { getAdminThumbnailUrl } = useImageOptimization();

  useEffect(() => {
    loadDashboardData();
  }, [selectedTimeRange]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // 기본 통계 로드
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

      setStats({
        totalImages: images.length,
        totalCategories: categories.length,
        totalLikes,
        totalComments,
        recentUploads,
        popularCategories,
        topImages
      });
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ko-KR').format(num);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
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
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">대시보드 데이터를 불러올 수 없습니다.</p>
        <Button onClick={loadDashboardData} className="mt-4">
          다시 시도
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 시간 범위 선택 */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={selectedTimeRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTimeRange(range)}
            >
              {range === '7d' ? '7일' : range === '30d' ? '30일' : '90일'}
            </Button>
          ))}
        </div>
      </div>

      {/* 통계 카드 */}
      <DashboardStats selectedTimeRange={selectedTimeRange} />

      {/* 빠른 액션 버튼 */}
      <div className="flex flex-wrap gap-4">
        <Button
          onClick={() => window.location.href = '/admin/images'}
          className="flex items-center gap-2"
        >
          <ImageIcon className="h-4 w-4" />
          이미지 관리
        </Button>
        <Button
          onClick={() => window.location.href = '/admin/categories'}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Database className="h-4 w-4" />
          카테고리 관리
        </Button>
        <Button
          onClick={() => window.location.href = '/admin/analytics'}
          variant="outline"
          className="flex items-center gap-2"
        >
          <BarChart3 className="h-4 w-4" />
          분석 보기
        </Button>
        <Button
          onClick={loadDashboardData}
          variant="ghost"
          className="flex items-center gap-2"
        >
          <Calendar className="h-4 w-4" />
          새로고침
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 최근 업로드 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">최근 업로드</h2>
          </div>
          
          <div className="space-y-3">
            {stats.recentUploads.map((image) => (
              <div key={image.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                <img
                  src={image.thumbnail_url}
                  alt={image.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{image.title}</p>
                  <p className="text-sm text-gray-500">{formatDate(image.created_at)}</p>
                </div>
                <div className="text-right">
                  <Badge variant="secondary" className="text-xs">
                    {image.likes_count} 좋아요
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* 인기 카테고리 */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold">인기 카테고리</h2>
          </div>
          
          <div className="space-y-3">
            {stats.popularCategories.map(({ category, count }) => (
              <div key={category.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{category.name}</p>
                  {category.description && (
                    <p className="text-sm text-gray-500">{category.description}</p>
                  )}
                </div>
                <Badge variant="outline">
                  {formatNumber(count)}개
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* 활동 로그 */}
        <div className="lg:col-span-1">
          <ActivityLog />
        </div>
      </div>

      {/* 시스템 상태 */}
      <SystemStatus />

      {/* 인기 이미지 */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">인기 이미지</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {stats.topImages.slice(0, 6).map((image) => (
            <div key={image.id} className="group relative">
              <img
                src={getAdminThumbnailUrl(image.url, 300, 300)}
                alt={image.title}
                className="w-full aspect-square rounded-lg object-cover group-hover:opacity-80 transition-opacity"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                <div className="text-white text-center p-2">
                  <p className="font-medium text-sm">{image.title}</p>
                  <p className="text-xs">{image.likes_count} 좋아요</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}