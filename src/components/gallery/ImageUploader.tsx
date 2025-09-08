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
import { PerformanceService } from '@/lib/performance';
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
  enableOptimization?: boolean;
  optimizationQuality?: number;
}

export default function ImageUploader({ 
  onUploadComplete, 
  maxFiles = 10,
  enableOptimization = true,
  optimizationQuality = 0.8
}: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [title, setTitle] = useState<string>('');
  const [author, setAuthor] = useState<string>('');
  const [optimizationEnabled, setOptimizationEnabled] = useState<boolean>(enableOptimization);
  const [quality, setQuality] = useState<number>(optimizationQuality);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
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
    const newFiles = acceptedFiles.map(file => {
      // 대용량 파일 경고 체크
      const largeFileValidation = storageService.validateLargeFile(file);
      if (largeFileValidation.warning) {
        toast.warning(largeFileValidation.warning);
      }
      
      return {
        file,
        preview: URL.createObjectURL(file),
        id: Math.random().toString(36).substring(2, 15)
      };
    });
    
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
    setUploadProgress(0);
    setCurrentFileIndex(0);
    const results: { url: string; thumbnailUrl: string; fileName: string; fileSize: number; width?: number; height?: number }[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const fileObj = files[i];
        setCurrentFileIndex(i + 1);
        
        // 진행률 업데이트
        const progress = ((i + 1) / files.length) * 100;
        setUploadProgress(progress);
        // 1. Storage에 최적화된 이미지 업로드 (최적화 옵션에 따라 자동 처리)
        const result = optimizationEnabled 
          ? await storageService.uploadOptimizedImageComplete(fileObj.file, {
              quality: quality,
              width: 1920,
              height: 1080,
              format: 'webp'
            })
          : await storageService.uploadImageComplete(fileObj.file);
        
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

      // 성능 통계 계산
      const totalOriginalSize = files.reduce((sum, file) => sum + file.file.size, 0);
      const totalOptimizedSize = results.reduce((sum, result) => sum + result.fileSize, 0);
      const compressionRatio = ((totalOriginalSize - totalOptimizedSize) / totalOriginalSize * 100).toFixed(1);
      
      if (optimizationEnabled && parseFloat(compressionRatio) > 5) {
        toast.success(`${files.length}개 이미지 업로드 완료! (${compressionRatio}% 압축)`);
      } else {
        toast.success(`${files.length}개 이미지 업로드 완료!`);
      }
      
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

      {/* 이미지 최적화 설정 */}
      <Card className="p-6">
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">이미지 최적화 설정</h3>
          </div>
          
          <div className="space-y-4">
            {/* 최적화 활성화 토글 */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="optimization-toggle" className="text-sm font-medium">
                  이미지 최적화 활성화
                </Label>
                <p className="text-xs text-gray-500 mt-1">
                  WebP 포맷으로 변환하고 압축하여 파일 크기를 줄입니다
                </p>
              </div>
              <input
                id="optimization-toggle"
                type="checkbox"
                checked={optimizationEnabled}
                onChange={(e) => setOptimizationEnabled(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
            </div>

            {/* 품질 설정 */}
            {optimizationEnabled && (
              <div className="space-y-2">
                <Label htmlFor="quality-slider" className="text-sm font-medium">
                  압축 품질: {Math.round(quality * 100)}%
                </Label>
                <input
                  id="quality-slider"
                  type="range"
                  min="0.5"
                  max="1.0"
                  step="0.1"
                  value={quality}
                  onChange={(e) => setQuality(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>고압축 (50%)</span>
                  <span>고품질 (100%)</span>
                </div>
                <p className="text-xs text-gray-500">
                  높은 품질은 파일 크기가 크지만 화질이 좋습니다
                </p>
              </div>
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
              JPG, PNG, WebP, GIF 지원 (최대 {maxFiles}개, 각각 50MB 이하)
            </p>
          </div>
        </div>
      </Card>

      {/* 선택된 이미지 미리보기 */}
      {files.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">선택된 이미지 ({files.length}개)</h3>
            <div className="flex flex-col items-end space-y-2">
              <Button
                onClick={uploadImages}
                disabled={uploading}
                className="min-w-24"
              >
                {uploading ? `업로드 중... (${currentFileIndex}/${files.length})` : '업로드'}
              </Button>
              {uploading && (
                <div className="w-32">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    {Math.round(uploadProgress)}% 완료
                  </p>
                </div>
              )}
            </div>
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
                  {optimizationEnabled && (
                    <span className="ml-2 text-green-600 font-medium">
                      → 최적화됨
                    </span>
                  )}
                  {fileObj.file.size > 20 * 1024 * 1024 && (
                    <span className="ml-2 text-amber-600 font-medium">
                      ⚠️ 대용량
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}