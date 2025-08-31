'use client';

import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import InfiniteScrollGallery from './InfiniteScrollGallery';

interface SearchResultsProps {
  searchQuery: string;
  onClearSearch: () => void;
  onSearchChange: (query: string) => void;
}

export default function SearchResults({
  searchQuery,
  onClearSearch,
  onSearchChange
}: SearchResultsProps) {
  const [relatedTags, setRelatedTags] = useState<string[]>([]);

  useEffect(() => {
    // TODO: 실제로는 검색 결과에서 관련 태그를 추출해야 함
    if (searchQuery) {
      // 임시로 하드코딩된 관련 태그
      const mockRelatedTags = [
        'nature', 'landscape', 'sunset', 'ocean', 'mountain',
        'portrait', 'architecture', 'street', 'abstract', 'art'
      ].filter(tag => 
        tag.toLowerCase().includes(searchQuery.toLowerCase()) || 
        searchQuery.toLowerCase().includes(tag.toLowerCase())
      ).slice(0, 5);
      
      setRelatedTags(mockRelatedTags);
    }
  }, [searchQuery]);

  const handleRelatedTagClick = (tag: string) => {
    onSearchChange(tag);
  };

  return (
    <div className="space-y-6">
      {/* 검색 헤더 */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSearch}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            전체 보기
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Search className="h-5 w-5 text-gray-400" />
            <span className="text-lg font-medium">&quot;{searchQuery}&quot; 검색 결과</span>
          </div>
          
          {relatedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <span className="text-sm text-gray-600">관련 태그:</span>
              {relatedTags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100"
                  onClick={() => handleRelatedTagClick(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 검색 결과 갤러리 */}
      <InfiniteScrollGallery searchQuery={searchQuery} />
    </div>
  );
}