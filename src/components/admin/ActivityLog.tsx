'use client';

import { useState, useEffect } from 'react';
import { Clock, User, Image as ImageIcon, Heart, MessageSquare, Upload, Trash2, Edit3 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { imageService } from '@/lib/database';
import type { Image } from '@/types';

interface ActivityItem {
  id: string;
  type: 'upload' | 'like' | 'comment' | 'delete' | 'edit';
  description: string;
  timestamp: string;
  image?: Image;
  user?: string;
}

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    setIsLoading(true);
    try {
      // 최근 이미지들을 가져와서 활동 로그 생성
      const images = await imageService.getAll(20, 0);
      
      const mockActivities: ActivityItem[] = [
        ...images.slice(0, 5).map((image, index) => ({
          id: `upload-${image.id}`,
          type: 'upload' as const,
          description: `새 이미지 업로드: ${image.title}`,
          timestamp: image.created_at,
          image,
          user: '사용자'
        })),
        ...images.slice(0, 3).map((image, index) => ({
          id: `like-${image.id}`,
          type: 'like' as const,
          description: `${image.likes_count}개의 좋아요를 받음`,
          timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
          image,
          user: '사용자'
        })),
        ...images.slice(0, 2).map((image, index) => ({
          id: `comment-${image.id}`,
          type: 'comment' as const,
          description: '새 댓글이 달림',
          timestamp: new Date(Date.now() - Math.random() * 172800000).toISOString(),
          image,
          user: '사용자'
        }))
      ];

      // 시간순으로 정렬
      mockActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      setActivities(mockActivities.slice(0, 10));
    } catch (error) {
      console.error('활동 로그 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upload':
        return <Upload className="w-4 h-4 text-blue-500" />;
      case 'like':
        return <Heart className="w-4 h-4 text-red-500" />;
      case 'comment':
        return <MessageSquare className="w-4 h-4 text-green-500" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'edit':
        return <Edit3 className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'upload':
        return 'bg-blue-50 border-blue-200';
      case 'like':
        return 'bg-red-50 border-red-200';
      case 'comment':
        return 'bg-green-50 border-green-200';
      case 'delete':
        return 'bg-red-50 border-red-200';
      case 'edit':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
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
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">최근 활동</h2>
        </div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold">최근 활동</h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={loadActivities}
          className="text-xs"
        >
          새로고침
        </Button>
      </div>
      
      <div className="space-y-3">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">최근 활동이 없습니다</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${getActivityColor(activity.type)}`}
            >
              <div className="flex-shrink-0 mt-0.5">
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(activity.timestamp)}
                  </span>
                  {activity.user && (
                    <>
                      <span className="text-xs text-gray-400">•</span>
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-500">{activity.user}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {activity.image && (
                <div className="flex-shrink-0">
                  <img
                    src={activity.image.thumbnail_url}
                    alt={activity.image.title}
                    className="w-10 h-10 rounded object-cover"
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
