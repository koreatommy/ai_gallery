'use client';

import { useState, useCallback } from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useDebounce } from '@/hooks/useDebounce';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({ 
  onSearch, 
  placeholder = "이미지 검색...", 
  className = "" 
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // 디바운스된 검색 (300ms 지연)
  const debouncedSearch = useDebounce(onSearch, 300);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  }, [debouncedSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  }, [query, onSearch]);

  return (
    <form onSubmit={handleSubmit} className={`relative ${className}`}>
      <div className="relative max-w-2xl mx-auto">
        {/* 배경 그라데이션 효과 */}
        <div className={`
          absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50
          opacity-0 transition-opacity duration-300
          ${isFocused ? 'opacity-100' : 'opacity-0'}
        `} />
        
        {/* 메인 검색 컨테이너 */}
        <div className={`
          relative flex items-center
          bg-white/80 backdrop-blur-sm
          rounded-2xl border-2
          transition-all duration-300 ease-out
          ${isFocused 
            ? 'border-blue-400 shadow-2xl shadow-blue-200/50 scale-[1.02]' 
            : 'border-gray-200 shadow-lg shadow-gray-100/50 hover:border-gray-300 hover:shadow-xl'
          }
        `}>
          {/* 검색 아이콘 */}
          <div className={`
            pl-5 pr-3 flex items-center justify-center
            transition-all duration-300
            ${isFocused ? 'text-blue-500 scale-110' : 'text-gray-400'}
          `}>
            <Search className="w-5 h-5" />
          </div>

          {/* 입력 필드 */}
          <Input
            type="text"
            value={query}
            onChange={handleInputChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className={`
              flex-1 border-0 bg-transparent
              text-base font-medium
              placeholder:text-gray-400 placeholder:font-normal
              focus-visible:ring-0 focus-visible:ring-offset-0
              py-6 pr-4
              transition-all duration-300
            `}
          />

          {/* 클리어 버튼 */}
          {query && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className={`
                mr-2 h-8 w-8 p-0 rounded-full
                hover:bg-gray-100 active:scale-95
                transition-all duration-200
                ${isFocused ? 'text-gray-500' : 'text-gray-400'}
              `}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* 포커스 시 장식 요소 */}
          {isFocused && (
            <div className="absolute -top-1 -right-1 animate-pulse">
              <Sparkles className="w-4 h-4 text-blue-400" />
            </div>
          )}
        </div>

        {/* 하단 글로우 효과 */}
        {isFocused && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent rounded-full blur-sm opacity-50 animate-pulse" />
        )}
      </div>
    </form>
  );
}