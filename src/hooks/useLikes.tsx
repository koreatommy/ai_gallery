'use client';

import { useState, useEffect, useCallback } from 'react';
import { likeService } from '@/lib/database';
import { toast } from 'sonner';

interface UseLikesOptions {
  userId?: string;
}

export function useLikes({ userId = '00000000-0000-0000-0000-000000000000' }: UseLikesOptions = {}) {
  const [likedImages, setLikedImages] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});

  // 로컬 스토리지에서 좋아요 상태 로드
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('likedImages');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setLikedImages(new Set(parsed));
        } catch (error) {
          console.error('좋아요 데이터 로드 실패:', error);
        }
      }
    }
  }, []);

  // 좋아요 상태 로컬 스토리지에 저장
  const saveLikedImages = (newLikedImages: Set<string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('likedImages', JSON.stringify([...newLikedImages]));
    }
  };

  // 좋아요 토글
  const toggleLike = async (imageId: string): Promise<{ isLiked: boolean; newCount: number }> => {
    try {
      const isCurrentlyLiked = likedImages.has(imageId);
      const result = await likeService.toggle(imageId, userId);
      
      // 로컬 상태 업데이트
      const newLikedImages = new Set(likedImages);
      if (result) {
        newLikedImages.add(imageId);
      } else {
        newLikedImages.delete(imageId);
      }
      setLikedImages(newLikedImages);
      saveLikedImages(newLikedImages);
      
      // 카운트 업데이트
      const currentCount = likeCounts[imageId] || 0;
      const newCount = result ? currentCount + 1 : currentCount - 1;
      setLikeCounts(prev => ({
        ...prev,
        [imageId]: Math.max(0, newCount)
      }));
      
      return { isLiked: result, newCount: Math.max(0, newCount) };
    } catch (error) {
      console.error('좋아요 토글 실패:', error);
      toast.error('좋아요 처리에 실패했습니다');
      throw error;
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

  return {
    toggleLike,
    getLikeCount,
    getCachedLikeCount,
    setImageLikeCount,
    setMultipleImageLikeCounts,
    isLiked,
    getLikedImageIds,
    likedImages: [...likedImages]
  };
}