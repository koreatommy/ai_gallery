'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { imageService } from '@/lib/database';
import type { Image } from '@/types';

interface UseInfiniteScrollOptions {
  limit?: number;
  searchQuery?: string;
  categoryId?: string;
  enabled?: boolean;
}

export function useInfiniteScroll({
  limit = 20,
  searchQuery = '',
  categoryId = '',
  enabled = true
}: UseInfiniteScrollOptions = {}) {
  const [images, setImages] = useState<Image[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const queryClient = useQueryClient();
  
  // 이전 필터 값을 추적하여 변경 감지
  const prevFiltersRef = useRef({ searchQuery, categoryId });

  // 필터가 변경되었는지 확인
  const filtersChanged = 
    prevFiltersRef.current.searchQuery !== searchQuery ||
    prevFiltersRef.current.categoryId !== categoryId;

  // 필터 변경시 상태 초기화
  useEffect(() => {
    if (filtersChanged) {
      console.log('필터 변경 감지:', { searchQuery, categoryId });
      setImages([]);
      setOffset(0);
      setHasMore(true);
      setIsLoadingMore(false);
      prevFiltersRef.current = { searchQuery, categoryId };
      
      // 기존 쿼리 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['images'], 
        exact: false 
      });
    }
  }, [searchQuery, categoryId, filtersChanged, queryClient]);

  // 고유한 쿼리 키 생성 (offset 제외)
  const baseQueryKey = useMemo(() => ['images', searchQuery, categoryId], [searchQuery, categoryId]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [...baseQueryKey, offset],
    queryFn: async () => {
      console.log(`데이터 로드: offset=${offset}, search="${searchQuery}", category="${categoryId}"`);
      let result: Image[];
      
      if (searchQuery && searchQuery.trim()) {
        result = await imageService.search(searchQuery.trim(), limit, offset);
      } else if (categoryId && categoryId.trim()) {
        result = await imageService.getByCategory(categoryId, limit, offset);
      } else {
        result = await imageService.getAll(limit, offset);
      }
      
      return result || [];
    },
    enabled: enabled,
    staleTime: 1000, // 1초로 줄여서 더 빠른 업데이트
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2,
  });

  // 데이터 업데이트 처리
  useEffect(() => {
    if (data) {
      console.log(`데이터 수신: ${data.length}개, offset=${offset}`);
      
      if (offset === 0) {
        // 첫 로드 또는 필터 변경 후 첫 로드
        setImages(data);
      } else {
        // 추가 로드 (무한 스크롤)
        setImages(prev => {
          const newImages = [...prev, ...data];
          console.log(`이미지 총 개수: ${newImages.length}`);
          return newImages;
        });
      }
      
      // 더 이상 데이터가 없는 경우
      if (data.length < limit) {
        setHasMore(false);
        console.log('더 이상 로드할 데이터 없음');
      }
      
      setIsLoadingMore(false);
    }
  }, [data, offset, limit]);

  const loadMore = useCallback(() => {
    if (!isLoading && !isLoadingMore && hasMore && !filtersChanged) {
      console.log('더 많은 데이터 로드 시작');
      setIsLoadingMore(true);
      setOffset(prev => prev + limit);
    }
  }, [isLoading, isLoadingMore, hasMore, limit, filtersChanged]);

  const refresh = useCallback(() => {
    console.log('데이터 새로고침');
    setImages([]);
    setOffset(0);
    setHasMore(true);
    setIsLoadingMore(false);
    queryClient.invalidateQueries({ 
      queryKey: baseQueryKey, 
      exact: false 
    });
  }, [queryClient, baseQueryKey]);

  // 무한 스크롤 이벤트 리스너
  useEffect(() => {
    const handleScroll = () => {
      if (
        enabled &&
        !isLoading &&
        !isLoadingMore &&
        hasMore &&
        !filtersChanged &&
        window.innerHeight + document.documentElement.scrollTop 
        >= document.documentElement.offsetHeight - 800
      ) {
        loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [enabled, isLoading, isLoadingMore, hasMore, loadMore, filtersChanged]);

  return {
    images,
    isLoading: isLoading && offset === 0, // 첫 로드만 로딩으로 표시
    isLoadingMore,
    isError,
    error,
    hasMore,
    loadMore,
    refresh
  };
}