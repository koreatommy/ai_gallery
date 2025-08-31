'use client';

import { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { useQueryClient } from '@tanstack/react-query';
import { Upload, X, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { storageService } from '@/lib/storage';
import { imageService, categoryService } from '@/lib/database';
import { toast } from 'sonner';
import type { Category } from '@/types';

interface ImageFile {
  file: File;
  preview: string;
  id: string;
}

interface ImageUploaderProps {
  onUploadComplete?: (results: { url: string; thumbnailUrl: string; fileName: string; fileSize: number; width?: number; height?: number }[]) => void;
  maxFiles?: number;
}

export default function ImageUploader({ onUploadComplete, maxFiles = 10 }: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const queryClient = useQueryClient();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await categoryService.getAll();
        setCategories(data);
      } catch (error) {
        console.error('카테고리 로드 실패:', error);
        toast.error('카테고리 목록을 불러올 수 없습니다');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(2, 15)
    }));
    
    setFiles(prev => [...prev, ...newFiles].slice(0, maxFiles));
  }, [maxFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    maxFiles,
    multiple: true
  });

  const removeFile = (id: string) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === id);
      if (fileToRemove) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  };

  const uploadImages = async () => {
    if (files.length === 0) {
      toast.error('업로드할 이미지를 선택해주세요.');
      return;
    }

    // 필수 필드 검증
    if (!title.trim()) {
      toast.error('제목을 입력해주세요.');
      return;
    }

    if (!author.trim()) {
      toast.error('작성자를 입력해주세요.');
      return;
    }

    if (!selectedCategory || selectedCategory === 'none') {
      toast.error('카테고리를 선택해주세요.');
      return;
    }

    setUploading(true);
    const results: { url: string; thumbnailUrl: string; fileName: string; fileSize: number; width?: number; height?: number }[] = [];

    try {
      for (const fileObj of files) {
        // 1. Storage에 이미지 업로드
        const result = await storageService.uploadImageComplete(fileObj.file);
        
        // 2. 데이터베이스에 이미지 메타데이터 저장
        await imageService.create({
          title: title, // 필수 필드이므로 항상 사용자 입력값 사용
          author: author, // 필수 필드이므로 항상 사용자 입력값 사용
          description: `업로드된 이미지: ${fileObj.file.name}`,
          url: result.url,
          thumbnail_url: result.thumbnailUrl,
          file_name: result.fileName,
          file_size: result.fileSize,
          width: result.width,
          height: result.height,
          tags: [],
          category_id: selectedCategory // 필수 필드이므로 항상 선택된 카테고리 사용
        });

        results.push({
          url: result.url,
          thumbnailUrl: result.thumbnailUrl,
          fileName: result.fileName,
          fileSize: result.fileSize,
          width: result.width,
          height: result.height
        });
      }

      toast.success(`${files.length}개 이미지 업로드 완료!`);
      
      // 미리보기 URL 정리
      files.forEach(f => URL.revokeObjectURL(f.preview));
      setFiles([]);
      
      // 입력 필드 초기화
      setTitle('');
      setAuthor('');
      
      // 카테고리 선택 유지 (사용자가 같은 카테고리에 여러 이미지를 계속 업로드할 수 있도록)
      // setSelectedCategory(''); // 필요시 주석 해제

      // 갤러리 캐시 무효화하여 새로고침
      queryClient.invalidateQueries({ queryKey: ['images'] });

      onUploadComplete?.(results);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(`업로드 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 이미지 정보 및 카테고리 설정 */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">이미지 정보 설정</h3>
          </div>
          
          {/* 제목과 작성자 입력 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title-input">제목 <span className="text-red-500">*</span></Label>
              <Input
                id="title-input"
                type="text"
                placeholder="이미지 제목을 입력하세요 (필수)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">
                이미지의 제목을 입력해주세요.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author-input">작성자 <span className="text-red-500">*</span></Label>
              <Input
                id="author-input"
                type="text"
                placeholder="작성자명을 입력하세요 (필수)"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full"
                required
              />
              <p className="text-xs text-gray-500">
                사진을 촬영하거나 제작한 사람의 이름입니다.
              </p>
            </div>
          </div>

          {/* 카테고리 선택 */}
          <div className="space-y-2">
            <Label htmlFor="category-select">카테고리 <span className="text-red-500">*</span></Label>
            <Select 
              value={selectedCategory} 
              onValueChange={setSelectedCategory}
              disabled={loadingCategories}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={
                  loadingCategories 
                    ? "카테고리 로딩 중..." 
                    : "카테고리를 선택하세요 (필수)"
                } />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedCategory && (
              <p className="text-sm text-gray-600">
                선택된 카테고리: <span className="font-medium text-blue-600">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              </p>
            )}
          </div>
        </div>
      </Card>

      {/* 저작권 경고 */}
      <Card className="p-4 bg-amber-50 border-amber-200">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-medium text-amber-800">저작권 주의사항</h4>
            <p className="text-sm text-amber-700 mt-1">
              업로드할 때 저작권에 위배되지 않도록 주의하세요. 본인이 직접 촬영하거나 제작한 이미지만 업로드해주세요.
            </p>
          </div>
        </div>
      </Card>

      {/* 드래그 앤 드롭 영역 */}
      <Card
        {...getRootProps()}
        className={`
          border-2 border-dashed p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300 hover:border-gray-400'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-4">
          <Upload className={`h-12 w-12 ${isDragActive ? 'text-primary' : 'text-gray-400'}`} />
          <div>
            <p className="text-lg font-medium">
              {isDragActive ? '이미지를 드롭하세요' : '이미지를 드래그하거나 클릭하여 선택'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              JPG, PNG, WebP, GIF 지원 (최대 {maxFiles}개, 각각 10MB 이하)
            </p>
          </div>
        </div>
      </Card>

      {/* 선택된 이미지 미리보기 */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">선택된 이미지 ({files.length}개)</h3>
            <Button
              onClick={uploadImages}
              disabled={uploading}
              className="min-w-24"
            >
              {uploading ? '업로드 중...' : '업로드'}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {files.map((fileObj) => (
              <div key={fileObj.id} className="relative">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={fileObj.preview}
                    alt="미리보기"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                  onClick={() => removeFile(fileObj.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
                
                <div className="mt-2 text-xs text-gray-600 truncate">
                  {fileObj.file.name}
                </div>
                <div className="text-xs text-gray-500">
                  {(fileObj.file.size / 1024 / 1024).toFixed(1)}MB
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}