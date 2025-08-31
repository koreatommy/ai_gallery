'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface LikeButtonProps {
  imageId: string;
  initialCount: number;
  initialLiked?: boolean;
  onToggle?: (imageId: string, newCount: number, isLiked: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  variant?: 'default' | 'ghost' | 'outline';
}

export default function LikeButton({
  imageId,
  initialCount,
  initialLiked = false,
  onToggle,
  size = 'md',
  showCount = true,
  variant = 'ghost'
}: LikeButtonProps) {
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setIsLiked(initialLiked);
    setCount(initialCount);
  }, [initialLiked, initialCount]);

  const handleToggle = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    const newIsLiked = !isLiked;
    const newCount = newIsLiked ? count + 1 : count - 1;
    
    // 낙관적 업데이트
    setIsLiked(newIsLiked);
    setCount(newCount);
    
    try {
      await onToggle?.(imageId, newCount, newIsLiked);
    } catch (error) {
      // 에러 발생시 롤백
      setIsLiked(isLiked);
      setCount(count);
    } finally {
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  const sizeClasses = {
    sm: 'h-6 w-6 p-1',
    md: 'h-8 w-8 p-2',
    lg: 'h-10 w-10 p-2.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={handleToggle}
      disabled={isAnimating}
      className={cn(
        'relative overflow-hidden transition-all duration-200',
        sizeClasses[size],
        isLiked 
          ? 'text-red-500 hover:text-red-600' 
          : 'text-gray-600 hover:text-red-500',
        variant === 'ghost' && isLiked && 'hover:bg-red-50',
        'group'
      )}
    >
      <div className="flex items-center gap-1">
        {/* 하트 아이콘 */}
        <div className="relative">
          <Heart
            className={cn(
              iconSizes[size],
              'transition-all duration-200',
              isLiked ? 'fill-current' : 'fill-none'
            )}
          />
          
          {/* 좋아요 애니메이션 */}
          <AnimatePresence>
            {isAnimating && isLiked && (
              <>
                {/* 펄스 효과 */}
                <motion.div
                  className="absolute inset-0 rounded-full bg-red-400"
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 2.5, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                />
                
                {/* 하트 파티클 */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute top-1/2 left-1/2 w-1 h-1 bg-red-500 rounded-full"
                    initial={{ 
                      scale: 0, 
                      x: 0, 
                      y: 0, 
                      opacity: 1 
                    }}
                    animate={{ 
                      scale: 1,
                      x: Math.cos(i * 72 * Math.PI / 180) * 20,
                      y: Math.sin(i * 72 * Math.PI / 180) * 20,
                      opacity: 0
                    }}
                    transition={{ 
                      duration: 0.6,
                      delay: 0.1,
                      ease: "easeOut"
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>
        </div>

        {/* 카운트 */}
        {showCount && (
          <AnimatePresence mode="wait">
            <motion.span
              key={count}
              initial={{ y: -10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                'text-xs font-medium',
                size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-base'
              )}
            >
              {count.toLocaleString()}
            </motion.span>
          </AnimatePresence>
        )}
      </div>

      {/* 호버 효과 */}
      <div className={cn(
        'absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-full',
        isLiked && 'opacity-5'
      )} />
    </Button>
  );
}