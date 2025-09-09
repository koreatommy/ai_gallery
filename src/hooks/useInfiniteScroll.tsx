'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { imageService } from '@/lib/database';
import type { Image } from '@/types';

interface UsePaginationOptions {
  limit?: number;
  searchQuery?: string;
  categoryId?: string;
  enabled?: boolean;
}

export function usePagination({
  limit = 20,
  searchQuery = '',
  categoryId = '',
  enabled = true
}: UsePaginationOptions = {}) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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
      setCurrentPage(1);
      setTotalCount(0);
      prevFiltersRef.current = { searchQuery, categoryId };
      
      // 기존 쿼리 캐시 무효화
      queryClient.invalidateQueries({ 
        queryKey: ['images'], 
        exact: false 
      });
    }
  }, [searchQuery, categoryId, filtersChanged, queryClient]);

  // 고유한 쿼리 키 생성
  const baseQueryKey = ['images', searchQuery, categoryId];
  const offset = (currentPage - 1) * limit;

  // 총 개수 쿼리
  const { data: totalCountData } = useQuery({
    queryKey: [...baseQueryKey, 'count'],
    queryFn: async () => {
      if (searchQuery && searchQuery.trim()) {
        return await imageService.getSearchCount(searchQuery.trim());
      } else if (categoryId && categoryId.trim()) {
        return await imageService.getCategoryCount(categoryId);
      } else {
        return await imageService.getTotalCount();
      }
    },
    enabled: enabled,
    staleTime: 5 * 60 * 1000, // 5분
  });

  const { data: images, isLoading, isError, error } = useQuery({
    queryKey: [...baseQueryKey, currentPage],
    queryFn: async () => {
      console.log(`데이터 로드: page=${currentPage}, offset=${offset}, search="${searchQuery}", category="${categoryId}"`);
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

  // 총 개수 업데이트
  useEffect(() => {
    if (totalCountData !== undefined) {
      setTotalCount(totalCountData);
    }
  }, [totalCountData]);

  // 페이지 이동 함수들
  const goToPage = useCallback((page: number) => {
    const totalPages = Math.ceil(totalCount / limit);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalCount, limit]);

  const goToNextPage = useCallback(() => {
    const totalPages = Math.ceil(totalCount / limit);
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalCount, limit]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const refresh = useCallback(() => {
    console.log('데이터 새로고침');
    setCurrentPage(1);
    setTotalCount(0);
    queryClient.invalidateQueries({ 
      queryKey: baseQueryKey, 
      exact: false 
    });
  }, [queryClient, baseQueryKey]);

  return {
    images: images || [],
    isLoading,
    isError,
    error,
    refresh,
    currentPage,
    totalCount,
    totalPages: Math.ceil(totalCount / limit),
    limit,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasNextPage: currentPage < Math.ceil(totalCount / limit),
    hasPrevPage: currentPage > 1
  };
}