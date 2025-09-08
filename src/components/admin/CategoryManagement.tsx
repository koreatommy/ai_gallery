'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit3, Trash2, MoreHorizontal, Tag, Search, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { categoryService, imageService } from '@/lib/database';
import type { Category } from '@/types';
import { toast } from 'sonner';

interface CategoryWithStats extends Category {
  imageCount: number;
}

export default function CategoryManagement() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [createDialog, setCreateDialog] = useState(false);
  const [editDialog, setEditDialog] = useState<{ open: boolean; category?: CategoryWithStats }>({ open: false });
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; categoryId?: string }>({ open: false });
  
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const [categoriesData, imageCounts] = await Promise.all([
        categoryService.getAll(),
        imageService.getCategoryImageCounts() // 카테고리별 이미지 개수만 가져오기
      ]);

      // 각 카테고리별 이미지 개수 매핑
      const categoryStats = categoriesData.map(category => ({
        ...category,
        imageCount: imageCounts[category.id] || 0
      }));

      setCategories(categoryStats);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      toast.error('카테고리 목록을 불러올 수 없습니다');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '' });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      await categoryService.create(formData.name.trim(), formData.description.trim() || undefined);
      toast.success('카테고리가 생성되었습니다');
      setCreateDialog(false);
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('카테고리 생성 실패:', error);
      toast.error('카테고리 생성에 실패했습니다');
    }
  };

  const handleEdit = (category: CategoryWithStats) => {
    setFormData({
      name: category.name,
      description: category.description || ''
    });
    setEditDialog({ open: true, category });
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !editDialog.category) return;

    try {
      await categoryService.update(
        editDialog.category.id, 
        formData.name.trim(), 
        formData.description.trim() || undefined
      );
      toast.success('카테고리가 수정되었습니다');
      setEditDialog({ open: false });
      resetForm();
      loadCategories();
    } catch (error) {
      console.error('카테고리 수정 실패:', error);
      toast.error('카테고리 수정에 실패했습니다');
    }
  };

  const handleDelete = async (categoryId: string) => {
    try {
      await categoryService.delete(categoryId);
      toast.success('카테고리가 삭제되었습니다');
      setDeleteDialog({ open: false });
      loadCategories();
    } catch (error) {
      console.error('카테고리 삭제 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '카테고리 삭제에 실패했습니다';
      toast.error(errorMessage);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">카테고리 관리</h1>
          <p className="text-gray-600">이미지 카테고리를 관리하고 편집할 수 있습니다</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadCategories}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            새로고침
          </Button>
          <Button
            onClick={() => setCreateDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            새 카테고리
          </Button>
        </div>
      </div>

      {/* 통계 정보 */}
      {!isLoading && categories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 카테고리</p>
                <p className="text-2xl font-bold text-gray-900">{categories.length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">활성 카테고리</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.filter(c => c.imageCount > 0).length}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Tag className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">총 이미지</p>
                <p className="text-2xl font-bold text-gray-900">
                  {categories.reduce((sum, c) => sum + c.imageCount, 0)}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* 검색 */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="카테고리 이름 또는 설명으로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* 카테고리 목록 */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </Card>
          ))}
        </div>
      ) : filteredCategories.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="text-gray-400 mb-4">
            <Tag className="h-16 w-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">카테고리를 찾을 수 없습니다</h3>
          <p className="text-gray-500 mb-4">검색 조건을 변경하거나 새로운 카테고리를 생성해보세요.</p>
          <Button onClick={() => setCreateDialog(true)}>
            새 카테고리 생성
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <Card key={category.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Tag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={category.imageCount > 0 ? "default" : "secondary"} 
                        className={`text-xs ${
                          category.imageCount > 0 
                            ? "bg-blue-100 text-blue-800" 
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {category.imageCount}개 이미지
                      </Badge>
                      {category.imageCount === 0 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          비어있음
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(category)}>
                      <Edit3 className="h-4 w-4 mr-2" />
                      편집
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setDeleteDialog({ open: true, categoryId: category.id })}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {category.description && (
                <p className="text-gray-600 text-sm mb-4">{category.description}</p>
              )}

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>생성일: {formatDate(category.created_at)}</span>
                {category.imageCount > 0 && (
                  <span className="text-green-600">활성</span>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 생성 다이얼로그 */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 카테고리 생성</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <Label htmlFor="create-name">카테고리 이름 *</Label>
              <Input
                id="create-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="카테고리 이름을 입력하세요"
                required
              />
            </div>
            <div>
              <Label htmlFor="create-description">설명</Label>
              <Textarea
                id="create-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="카테고리 설명을 입력하세요"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setCreateDialog(false); resetForm(); }}>
                취소
              </Button>
              <Button type="submit">생성</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 편집 다이얼로그 */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 편집</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div>
              <Label htmlFor="edit-name">카테고리 이름 *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="카테고리 이름을 입력하세요"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-description">설명</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="카테고리 설명을 입력하세요"
                rows={3}
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { setEditDialog({ open: false }); resetForm(); }}>
                취소
              </Button>
              <Button type="submit">수정</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>카테고리 삭제</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-gray-600">
              이 카테고리를 삭제하시겠습니까? 삭제된 카테고리는 복구할 수 없습니다.
            </p>
            {deleteDialog.categoryId && (
              (() => {
                const category = categories.find(c => c.id === deleteDialog.categoryId);
                return category && category.imageCount > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-amber-800 text-sm">
                      <strong>주의:</strong> 이 카테고리에 속한 {category.imageCount}개의 이미지가 "카테고리 미지정" 상태로 변경됩니다.
                    </p>
                  </div>
                ) : null;
              })()
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false })}>
              취소
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteDialog.categoryId && handleDelete(deleteDialog.categoryId)}
            >
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}