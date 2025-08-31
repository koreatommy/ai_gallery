'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Heart, MessageCircle, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import LikeButton from './LikeButton';
import ShareButton from './ShareButton';
import CommentSection from './CommentSection';
import { useLikes } from '@/hooks/useLikes';
import type { Image } from '@/types';

interface ImageLightboxProps {
  image: Image | null;
  images?: Image[];
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onLikeToggle?: (imageId: string) => void;
}

export default function ImageLightbox({
  image,
  images = [],
  isOpen,
  onClose,
  onNext,
  onPrevious,
  onLikeToggle
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showComments, setShowComments] = useState(false);
  const { isLiked, setImageLikeCount } = useLikes();

  // 이미지 변경시 좋아요 카운트 설정
  useEffect(() => {
    if (image) {
      setImageLikeCount(image.id, image.likes_count);
    }
  }, [image, setImageLikeCount]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setShowComments(false);
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          onPrevious?.();
          break;
        case 'ArrowRight':
          onNext?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isOpen, onClose, onNext, onPrevious]);

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * 1.5, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev / 1.5, 0.5));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = async () => {
    if (!image) return;
    
    try {
      const response = await fetch(image.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = image.file_name || 'image.jpg';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleLikeToggle = async (imageId: string) => {
    onLikeToggle?.(imageId);
  };


  if (!image) return null;

  const currentIndex = images.findIndex(img => img.id === image.id);
  const canGoNext = currentIndex < images.length - 1;
  const canGoPrevious = currentIndex > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          {/* 헤더 */}
          <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
            <div className="flex items-center justify-between text-white">
              <div className="flex items-center space-x-4">
                <div className="flex flex-col">
                  <h2 className="text-xl font-medium">{image.title}</h2>
                  {image.author && (
                    <span className="text-sm opacity-75">by {image.author}</span>
                  )}
                </div>
                {images.length > 1 && (
                  <span className="text-sm opacity-75">
                    {currentIndex + 1} / {images.length}
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomOut}
                  disabled={zoom <= 0.5}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                
                <span className="text-sm px-2">
                  {Math.round(zoom * 100)}%
                </span>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleZoomIn}
                  disabled={zoom >= 3}
                  className="text-white hover:bg-white/20"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                
                <Separator orientation="vertical" className="h-6 bg-white/20" />
                
                <LikeButton
                  imageId={image.id}
                  initialCount={image.likes_count}
                  initialLiked={isLiked(image.id)}
                  onToggle={handleLikeToggle}
                  size="sm"
                  variant="ghost"
                />
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowComments(!showComments)}
                  className={`text-white hover:bg-white/20 ${showComments ? 'bg-white/20' : ''}`}
                  title="댓글 보기"
                >
                  <MessageCircle className="h-4 w-4 mr-1" />
                  {image.comments_count || 0}
                </Button>
                
                <div className="[&>button]:text-white [&>button]:hover:bg-white/20">
                  <ShareButton 
                    image={image}
                    size="sm"
                    variant="ghost"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/20"
                >
                  <Download className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="text-white hover:bg-white/20"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* 이미지 */}
          <div className="flex-1 flex items-center justify-center px-16 py-20">
            <motion.img
              key={image.id}
              src={image.url}
              alt={image.title}
              className={`max-w-full max-h-full object-contain select-none ${
                zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'
              } ${isDragging ? 'cursor-grabbing' : ''}`}
              style={{
                transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                transformOrigin: 'center'
              }}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onClick={(e) => {
                if (zoom === 1) {
                  e.stopPropagation();
                  handleZoomIn();
                }
              }}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* 네비게이션 버튼 */}
          {canGoPrevious && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0"
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          {canGoNext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12 p-0"
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}

          {/* 댓글 사이드 패널 */}
          <AnimatePresence>
            {showComments && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="absolute top-0 right-0 bottom-0 w-96 bg-white/95 backdrop-blur-sm shadow-2xl z-20 flex flex-col"
              >
                <div className="flex-1 flex flex-col">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">댓글</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowComments(false)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-hidden">
                    <CommentSection imageId={image.id} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 하단 정보 패널 */}
          <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent p-4">
            <div className="text-white space-y-2">
              {image.description && (
                <p className="text-sm opacity-90">{image.description}</p>
              )}
              
              {image.tags && image.tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {image.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-xs opacity-75">
                <div className="flex items-center space-x-4">
                  {image.author && (
                    <span>작성자: {image.author}</span>
                  )}
                  <span>{new Date(image.created_at).toLocaleDateString('ko-KR')}</span>
                  {image.width && image.height && (
                    <span>{image.width} × {image.height}</span>
                  )}
                </div>
                
                <div className="flex items-center space-x-3">
                  <span className="flex items-center">
                    <Heart className="h-3 w-3 mr-1" />
                    {image.likes_count}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="h-3 w-3 mr-1" />
                    {image.comments_count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}