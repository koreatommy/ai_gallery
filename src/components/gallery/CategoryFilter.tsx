'use client';

import { useState } from 'react';
import { ChevronDown, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { Category } from '@/types';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategoryChange
}: CategoryFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategoryData = categories.find(cat => cat.id === selectedCategory);

  const handleCategorySelect = (categoryId: string) => {
    onCategoryChange(categoryId);
    setIsOpen(false);
  };

  const handleClearFilter = () => {
    onCategoryChange('');
  };

  return (
    <div className="flex items-center space-x-4">
      {/* 카테고리 드롭다운 */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="flex items-center space-x-2 min-w-[400px] w-full max-w-lg justify-between"
          >
            <div className="flex items-center space-x-2">
              <Grid3X3 className="w-4 h-4" />
              <span>
                {selectedCategoryData ? selectedCategoryData.name : '모든 카테고리'}
              </span>
            </div>
            <ChevronDown className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[400px]">
          <DropdownMenuItem onClick={handleClearFilter}>
            <div className="flex items-center space-x-2 w-full">
              <Grid3X3 className="w-4 h-4" />
              <span>모든 카테고리</span>
            </div>
          </DropdownMenuItem>
          {categories.map((category) => (
            <DropdownMenuItem
              key={category.id}
              onClick={() => handleCategorySelect(category.id)}
              className="flex items-center space-x-2"
            >
              <span className="flex-1">{category.name}</span>
              {category.description && (
                <Badge variant="secondary" className="text-xs">
                  {category.description}
                </Badge>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 선택된 카테고리 표시 */}
      {selectedCategoryData && (
        <Card className="px-3 py-2 bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-blue-600 hover:bg-blue-700">
              {selectedCategoryData.name}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilter}
              className="h-6 w-6 p-0 text-blue-600 hover:text-blue-800"
            >
              ×
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}