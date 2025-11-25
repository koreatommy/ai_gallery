'use client';

import { useState, useEffect } from 'react';
import { Search, Filter, Trash2, Edit3, Eye, MoreHorizontal, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { imageService, categoryService } from '@/lib/database';
import { storageService } from '@/lib/storage';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import type { Image, Category } from '@/types';
import { toast } from 'sonner';

export default function ImageManagement() {
  const [images, setImages] = useState<Image[]>([]);
  const [allImages, setAllImages] = useState<Image[]>([]); // 전체 이미지 저장
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; imageId?: string }>({ open: false });
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [categoryChangeDialog, setCategoryChangeDialog] = useState<{ open: boolean; imageId?: string; currentCategoryId?: string }>({ open: false });
  const [editDialog, setEditDialog] = useState<{ open: boolean; image?: Image }>({ open: false });
  const [editTitle, setEditTitle] = useState('');
  const [editAuthor, setEditAuthor] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'likes' | 'name' | 'size'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 페이징 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [totalPages, setTotalPages] = useState(1);

  // 이미지 최적화 훅
  const { getAdminThumbnailUrl } = useImageOptimization();

  useEffect(() => {
    loadImages();
    loadCategories();
  }, []);

  // 카테고리 필터 변경 시 자동 검색
  useEffect(() => {
    if (categories.length > 0) {
      handleSearch();
    }
  }, [selectedCategory]);

  // 검색어, 정렬, 페이지 변경 시 필터링 및 페이징 적용
  useEffect(() => {
    if (allImages.length > 0) {
      applyFiltersAndPagination(allImages);
    }
  }, [searchQuery, selectedCategory, sortBy, sortOrder, currentPage, allImages]);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      toast.error('카테고리 목록을 불러올 수 없습니다');
    }
  };

  const loadImages = async () => {
    setIsLoading(true);
    try {
      // 모든 이미지를 가져와서 allImages에 저장
      const data = await imageService.getAll(1000, 0); // 충분히 큰 수로 설정
      setAllImages(data);
      applyFiltersAndPagination(data);
    } catch (error) {
      console.error('이미지 로드 실패:', error);
      toast.error('이미지 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  // 필터링과 페이징을 적용하는 함수
  const applyFiltersAndPagination = (imageData: Image[]) => {
    // 필터링 적용
    const filteredImages = imageData.filter(image => {
      // 검색어 필터링
      const matchesSearch = !searchQuery.trim() || 
        image.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        image.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      
      // 카테고리 필터링
      let matchesCategory = true;
      if (selectedCategory === 'none') {
        matchesCategory = !image.category_id;
      } else if (selectedCategory !== 'all') {
        matchesCategory = image.category_id === selectedCategory;
      }
      
      return matchesSearch && matchesCategory;
    });

    // 정렬 적용
    const sortedImages = filteredImages.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
        case 'likes':
          aValue = a.likes_count;
          bValue = b.likes_count;
          break;
        case 'name':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'size':
          aValue = a.file_size;
          bValue = b.file_size;
          break;
        default:
          return 0;
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // 페이징 적용
    const totalPagesCount = Math.ceil(sortedImages.length / itemsPerPage);
    setTotalPages(totalPagesCount);
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedImages = sortedImages.slice(startIndex, endIndex);
    
    setImages(paginatedImages);
  };

  const handleSearch = () => {
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
    applyFiltersAndPagination(allImages);
  };

  const handleSelectImage = (imageId: string) => {
    const newSelection = new Set(selectedImages);
    if (newSelection.has(imageId)) {
      newSelection.delete(imageId);
    } else {
      newSelection.add(imageId);
    }
    setSelectedImages(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedImages.size === images.length) {
      setSelectedImages(new Set());
    } else {
      setSelectedImages(new Set(images.map(img => img.id)));
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    try {
      await imageService.delete(imageId);
      setImages(prev => prev.filter(img => img.id !== imageId));
      setDeleteDialog({ open: false });
      toast.success('이미지가 삭제되었습니다');
    } catch (error) {
      console.error('삭제 실패:', error);
      toast.error('이미지 삭제에 실패했습니다');
    }
  };

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedImages).map(id => imageService.delete(id));
      await Promise.all(deletePromises);
      
      setImages(prev => prev.filter(img => !selectedImages.has(img.id)));
      setSelectedImages(new Set());
      setBulkDeleteDialog(false);
      toast.success(`${selectedImages.size}개 이미지가 삭제되었습니다`);
    } catch (error) {
      console.error('일괄 삭제 실패:', error);
      toast.error('이미지 삭제에 실패했습니다');
    }
  };

  const handleCategoryChange = async (imageId: string, newCategoryId: string | null) => {
    try {
      await imageService.update(imageId, { category_id: newCategoryId });
      
      // 로컬 상태 업데이트
      setImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, category_id: newCategoryId }
          : img
      ));
      
      // allImages도 업데이트
      setAllImages(prev => prev.map(img => 
        img.id === imageId 
          ? { ...img, category_id: newCategoryId }
          : img
      ));
      
      setCategoryChangeDialog({ open: false });
      toast.success('카테고리가 변경되었습니다');
    } catch (error) {
      console.error('카테고리 변경 실패:', error);
      toast.error('카테고리 변경에 실패했습니다');
    }
  };

  const handleEditClick = (image: Image) => {
    setEditTitle(image.title);
    setEditAuthor(image.author || '');
    setEditDialog({ open: true, image });
  };

  const handleImageUpdate = async () => {
    if (!editDialog.image) return;
    
    if (!editTitle.trim()) {
      toast.error('제목을 입력해주세요');
      return;
    }

    if (!editAuthor.trim()) {
      toast.error('작성자를 입력해주세요');
      return;
    }

    try {
      await imageService.update(editDialog.image.id, { 
        title: editTitle.trim(),
        author: editAuthor.trim()
      });
      
      // 로컬 상태 업데이트
      setImages(prev => prev.map(img => 
        img.id === editDialog.image!.id 
          ? { ...img, title: editTitle.trim(), author: editAuthor.trim() }
          : img
      ));
      
      // allImages도 업데이트
      setAllImages(prev => prev.map(img => 
        img.id === editDialog.image!.id 
          ? { ...img, title: editTitle.trim(), author: editAuthor.trim() }
          : img
      ));
      
      setEditDialog({ open: false });
      toast.success('이미지 정보가 수정되었습니다');
    } catch (error) {
      console.error('이미지 정보 수정 실패:', error);
      toast.error('이미지 정보 수정에 실패했습니다');
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('all');
    setCurrentPage(1);
    applyFiltersAndPagination(allImages);
  };

  // 페이징 관련 함수들
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  // 페이징 버튼 생성
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // 총 페이지가 5개 이하면 모두 표시
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 현재 페이지를 중심으로 앞뒤 2개씩 표시
      const start = Math.max(1, currentPage - 2);
      const end = Math.min(totalPages, currentPage + 2);
      
      if (start > 1) {
        pages.push(1);
        if (start > 2) {
          pages.push('...');
        }
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (end < totalPages) {
        if (end < totalPages - 1) {
          pages.push('...');
        }
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '날짜 없음';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return '날짜 없음';
    }
  };

  const formatFileSize = (bytes: number | undefined | null) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    if (isNaN(bytes)) return '크기 없음';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return '카테고리 없음';
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '알 수 없는 카테고리';
  };

  // 이미지가 20개 이하인 경우 페이징 숨기기
  const showPagination = allImages.length > itemsPerPage;

  return (
    <div className="space-y-6">

      {/* 검색 및 필터 */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="이미지 제목, 설명, 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10"
              />
            </div>
            
            {/* 카테고리 필터 */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="카테고리 선택">
                  {selectedCategory === 'all' ? '모든 카테고리' : 
                   selectedCategory === 'none' ? '카테고리 없음' : 
                   getCategoryName(selectedCategory)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 카테고리</SelectItem>
                <SelectItem value="none">카테고리 없음</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button onClick={handleSearch}>
              검색
            </Button>
          </div>
          
          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  정렬: {sortBy === 'date' ? '날짜' : sortBy === 'likes' ? '좋아요' : sortBy === 'name' ? '이름' : '크기'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('desc'); }}>
                  최신순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('date'); setSortOrder('asc'); }}>
                  오래된순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('likes'); setSortOrder('desc'); }}>
                  좋아요 많은순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('name'); setSortOrder('asc'); }}>
                  이름순
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('size'); setSortOrder('desc'); }}>
                  용량 큰순
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedImages.size === images.length ? '전체 해제' : '전체 선택'}
            </Button>
            
            {(searchQuery || selectedCategory !== 'all') && (
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-800"
              >
                필터 초기화
              </Button>
            )}
            
            {selectedImages.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteDialog(true)}
              >
                선택 삭제 ({selectedImages.size})
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* 이미지 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="animate-pulse">
                <div className="aspect-video bg-gray-200"></div>
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : images.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Search className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">이미지를 찾을 수 없습니다</h3>
          <p className="text-gray-500">
            {searchQuery || selectedCategory !== 'all'
              ? '검색 조건을 변경하거나 필터를 초기화해보세요.' 
              : '새로운 이미지를 업로드해보세요.'
            }
          </p>
          {(searchQuery || selectedCategory !== 'all') && (
            <Button 
              variant="outline" 
              onClick={handleClearFilters}
              className="mt-4"
            >
              필터 초기화
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {images.map((image) => (
            <Card key={image.id} className="overflow-hidden">
              {/* 이미지 */}
              <div className="relative aspect-video">
                <input
                  type="checkbox"
                  checked={selectedImages.has(image.id)}
                  onChange={() => handleSelectImage(image.id)}
                  className="absolute top-3 left-3 z-10 w-4 h-4"
                />
                <img
                  src={getAdminThumbnailUrl(image.url, 600, 400)}
                  alt={image.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* 정보 */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate flex-1">
                    {image.title}
                  </h3>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="ml-2">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => window.open(image.url, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        보기
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleEditClick(image)}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        편집
                      </DropdownMenuItem>
                      <Separator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialog({ open: true, imageId: image.id })}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        삭제
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {image.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {image.description}
                  </p>
                )}

                {/* 카테고리 */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Tag className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">카테고리</span>
                  </div>
                  <Select
                    value={image.category_id || ''}
                    onValueChange={(value) => {
                      const newCategoryId = value === 'none' ? null : value;
                      handleCategoryChange(image.id, newCategoryId);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="카테고리 선택">
                        {getCategoryName(image.category_id)}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">카테고리 없음</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 태그 */}
                {image.tags && image.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {image.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {image.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{image.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* 작성자 정보 */}
                {image.author && (
                  <div className="mb-2">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="font-medium">작성자:</span>
                      <span>{image.author}</span>
                    </div>
                  </div>
                )}

                {/* 메타 정보 */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(image.created_at)}</span>
                  <span>{formatFileSize(image.file_size)}</span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500 mt-1">
                  {image.width && image.height && !isNaN(image.width) && !isNaN(image.height) ? (
                    <span>{image.width} × {image.height}</span>
                  ) : (
                    <span></span>
                  )}
                  <span>{image.likes_count || 0} 좋아요</span>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 페이징 컴포넌트 */}
      {showPagination && totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              총 {allImages.length}개 중 {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, allImages.length)}개 표시
            </div>
            
            <div className="flex items-center gap-2">
              {/* 이전 페이지 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" />
                이전
              </Button>
              
              {/* 페이지 번호 버튼들 */}
              <div className="flex items-center gap-1">
                {generatePageNumbers().map((page, index) => (
                  <div key={index}>
                    {page === '...' ? (
                      <span className="px-2 py-1 text-gray-500">...</span>
                    ) : (
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(page as number)}
                        className="w-8 h-8 p-0"
                      >
                        {page}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 다음 페이지 버튼 */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1"
              >
                다음
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* 개별 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            이 이미지를 삭제하시겠습니까? 삭제된 이미지는 복구할 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog.imageId && handleDeleteImage(deleteDialog.imageId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 일괄 삭제 확인 다이얼로그 */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선택된 이미지 삭제</DialogTitle>
          </DialogHeader>
          <p className="text-gray-600">
            선택된 {selectedImages.size}개의 이미지를 삭제하시겠습니까? 삭제된 이미지는 복구할 수 없습니다.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              {selectedImages.size}개 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 이미지 정보 편집 다이얼로그 */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>이미지 정보 수정</DialogTitle>
          </DialogHeader>
          {editDialog.image && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">제목 <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-title"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="이미지 제목을 입력하세요"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleImageUpdate();
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-author">작성자 <span className="text-red-500">*</span></Label>
                <Input
                  id="edit-author"
                  value={editAuthor}
                  onChange={(e) => setEditAuthor(e.target.value)}
                  placeholder="작성자명을 입력하세요"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleImageUpdate();
                    }
                  }}
                />
              </div>
              {editDialog.image.url && (
                <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={getAdminThumbnailUrl(editDialog.image.url, 600, 400)}
                    alt={editDialog.image.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>
              취소
            </Button>
            <Button onClick={handleImageUpdate}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}