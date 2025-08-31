'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { categoryService, imageService } from '@/lib/database';
import type { Category } from '@/types';
import { toast } from 'sonner';

const imageMetadataSchema = z.object({
  title: z.string().min(1, '제목은 필수입니다').max(255, '제목이 너무 깁니다'),
  description: z.string().max(1000, '설명이 너무 깁니다').optional(),
  category_id: z.string().optional(),
  tags: z.array(z.string()).max(10, '태그는 최대 10개까지 가능합니다').optional()
});

type ImageMetadataForm = z.infer<typeof imageMetadataSchema>;

interface ImageMetadataFormProps {
  imageUrl: string;
  thumbnailUrl: string;
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  onSave?: (imageData: unknown) => void;
  onCancel?: () => void;
}

export default function ImageMetadataForm({
  imageUrl,
  thumbnailUrl,
  fileName,
  fileSize,
  width,
  height,
  onSave,
  onCancel
}: ImageMetadataFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<ImageMetadataForm>({
    resolver: zodResolver(imageMetadataSchema)
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await categoryService.getAll();
      setCategories(data);
    } catch (error) {
      console.error('카테고리 로드 실패:', error);
      toast.error('카테고리를 불러올 수 없습니다.');
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      const newTags = [...tags, tag];
      setTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove);
    setTags(newTags);
    setValue('tags', newTags);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const onSubmit = async (data: ImageMetadataForm) => {
    setSaving(true);
    try {
      const imageData = {
        title: data.title,
        description: data.description || undefined,
        url: imageUrl,
        thumbnail_url: thumbnailUrl,
        file_name: fileName,
        file_size: fileSize,
        width,
        height,
        category_id: data.category_id || undefined,
        tags: tags
      };

      const savedImage = await imageService.create(imageData);
      toast.success('이미지가 저장되었습니다!');
      onSave?.(savedImage);
    } catch (error) {
      console.error('저장 실패:', error);
      toast.error(`저장 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 이미지 미리보기 */}
      <div className="flex gap-4">
        <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          <img
            src={thumbnailUrl}
            alt="미리보기"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 space-y-2 text-sm text-gray-600">
          <p><strong>파일명:</strong> {fileName}</p>
          <p><strong>크기:</strong> {(fileSize / 1024 / 1024).toFixed(2)}MB</p>
          {width && height && (
            <p><strong>해상도:</strong> {width} × {height}</p>
          )}
        </div>
      </div>

      {/* 메타데이터 폼 */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* 제목 */}
        <div className="space-y-2">
          <Label htmlFor="title">제목 *</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="이미지 제목을 입력하세요"
          />
          {errors.title && (
            <p className="text-sm text-red-500">{errors.title.message}</p>
          )}
        </div>

        {/* 설명 */}
        <div className="space-y-2">
          <Label htmlFor="description">설명</Label>
          <Textarea
            id="description"
            {...register('description')}
            placeholder="이미지에 대한 설명을 입력하세요"
            rows={3}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        {/* 카테고리 */}
        <div className="space-y-2">
          <Label>카테고리</Label>
          <Select onValueChange={(value) => setValue('category_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="카테고리를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 태그 */}
        <div className="space-y-2">
          <Label>태그</Label>
          <div className="flex gap-2">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={handleTagInputKeyPress}
              placeholder="태그를 입력하고 Enter를 누르세요"
              className="flex-1"
            />
            <Button type="button" onClick={addTag} variant="outline">
              추가
            </Button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer hover:text-red-500"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          )}
          <p className="text-sm text-gray-500">
            태그는 최대 10개까지 추가할 수 있습니다. ({tags.length}/10)
          </p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={saving} className="flex-1">
            {saving ? '저장 중...' : '저장'}
          </Button>
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        </div>
      </form>
    </div>
  );
}