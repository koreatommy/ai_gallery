'use client';

import { useState, useEffect, useCallback } from 'react';
import { likeService } from '@/lib/database';
import { userManager } from '@/lib/userManager';
import { toast } from 'sonner';

interface UseLikesOptions {
  userId?: string;
}

export function useLikes({ userId }: UseLikesOptions = {}) {
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(false);

  // 현재 사용자 ID 가져오기
  const getCurrentUserId = useCallback(() => {
    return userId || userManager.getUserId();
  }, [userId]);

  // 로컬 스토리지에서 좋아요 상태 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentUserId = getCurrentUserId();
      const saved = localStorage.getItem(`likedImages_${currentUserId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLikedImages(new Set(parsed));
        } catch (error) {
          console.error('좋아요 데이터 로드 실패:', error);
        }
      }
    }
  }, [getCurrentUserId]);

  // 좋아요 상태 로컬 스토리지에 저장
  const saveLikedImages = useCallback((newLikedImages: Set<string>) => {
    if (typeof window !== 'undefined') {
      const currentUserId = getCurrentUserId();
      localStorage.setItem(`likedImages_${currentUserId}`, JSON.stringify([...newLikedImages]));
    }
  }, [getCurrentUserId]);

  // 좋아요 토글
  const toggleLike = async (imageId: string): Promise<{ isLiked: boolean; newCount: number }> => {
    if (isLoading) {
      console.warn('좋아요 처리 중입니다. 잠시 후 다시 시도해주세요.');
      return { isLiked: likedImages.has(imageId), newCount: likeCounts[imageId] || 0 };
    }

    setIsLoading(true);
    
    try {
      const currentUserId = getCurrentUserId();
      const isCurrentlyLiked = likedImages.has(imageId);
      
      // 낙관적 업데이트
      const newLikedImages = new Set(likedImages);
      const currentCount = likeCounts[imageId] || 0;
      const optimisticCount = isCurrentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
      
      if (isCurrentlyLiked) {
        newLikedImages.delete(imageId);
      } else {
        newLikedImages.add(imageId);
      }
      
      setLikedImages(newLikedImages);
      setLikeCounts(prev => ({
        ...prev,
        [imageId]: optimisticCount
      }));
      
      // 서버에 요청
      const result = await likeService.toggle(imageId, currentUserId);
      
      // 서버 응답에 따라 상태 조정
      if (result !== !isCurrentlyLiked) {
        // 서버 응답이 예상과 다르면 롤백
        if (isCurrentlyLiked) {
          newLikedImages.add(imageId);
        } else {
          newLikedImages.delete(imageId);
        }
        setLikedImages(newLikedImages);
        setLikeCounts(prev => ({
          ...prev,
          [imageId]: currentCount
        }));
      }
      
      // 로컬 스토리지에 저장
      saveLikedImages(newLikedImages);
      
      // 성공 메시지
      toast.success(result ? '좋아요를 눌렀습니다!' : '좋아요를 취소했습니다');
      
      return { isLiked: result, newCount: optimisticCount };
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      
      // 에러 발생시 원래 상태로 롤백
      const currentCount = likeCounts[imageId] || 0;
      setLikeCounts(prev => ({
        ...prev,
        [imageId]: currentCount
      }));
      
      toast.error('좋아요 처리에 실패했습니다. 다시 시도해주세요.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 특정 이미지의 좋아요 카운트 가져오기
  const getLikeCount = async (imageId: string): Promise<number> => {
    try {
      if (likeCounts[imageId] !== undefined) {
        return likeCounts[imageId];
      }
      
      const count = await likeService.getCount(imageId);
      setLikeCounts(prev => ({
        ...prev,
        [imageId]: count
      }));
      
      return count;
    } catch (error) {
      console.error('좋아요 카운트 로드 실패:', error);
      return 0;
    }
  };

  // 이미지가 좋아요 되었는지 확인
  const isLiked = (imageId: string): boolean => {
    return likedImages.has(imageId);
  };

  // 좋아요한 이미지 목록 가져오기 (북마크 기능용)
  const getLikedImageIds = (): string[] => {
    return [...likedImages];
  };

  // 특정 이미지의 현재 카운트 가져오기 (캐시된 값)
  const getCachedLikeCount = (imageId: string): number => {
    return likeCounts[imageId] || 0;
  };

  // 이미지의 좋아요 카운트 설정 (초기값 설정용)
  const setImageLikeCount = useCallback((imageId: string, count: number) => {
    setLikeCounts(prev => {
      // 이미 같은 값이면 업데이트하지 않음 (무한 루프 방지)
      if (prev[imageId] === count) {
        return prev;
      }
      return {
        ...prev,
        [imageId]: count
      };
    });
  }, []);

  // 다중 이미지의 좋아요 카운트 설정
  const setMultipleImageLikeCounts = useCallback((counts: Record<string, number>) => {
    setLikeCounts(prev => ({
      ...prev,
      ...counts
    }));
  }, []);

  // 사용자 정보 가져오기
  const getUserInfo = useCallback(() => {
    return userManager.getUserInfo();
  }, []);

  // 사용자 통계 가져오기
  const getUserStats = useCallback(() => {
    return userManager.getStats();
  }, []);

  return {
    toggleLike,
    getLikeCount,
    getCachedLikeCount,
    setImageLikeCount,
    setMultipleImageLikeCounts,
    isLiked,
    getLikedImageIds,
    getUserInfo,
    getUserStats,
    isLoading,
    likedImages: [...likedImages]
  };
}