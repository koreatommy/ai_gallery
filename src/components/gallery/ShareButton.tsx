'use client';

import { useState } from 'react';
import { Share2, Copy, Check, Facebook, Twitter, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import type { Image } from '@/types';

interface ShareButtonProps {
  image: Image;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'outline';
  showText?: boolean;
}

export default function ShareButton({
  image,
  size = 'md',
  variant = 'ghost',
  showText = false
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}?image=${image.id}`
    : '';
  
  const shareTitle = image.title;
  const shareDescription = image.description || `${image.title} - AI Gallery`;

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareDescription,
          url: shareUrl
        });
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('공유 실패:', error);
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('링크가 복사되었습니다!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('복사 실패:', error);
      toast.error('링크 복사에 실패했습니다');
    }
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank', 'width=600,height=400');
  };

  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  // 모바일에서 네이티브 공유가 가능한 경우 단순 버튼으로 표시
  if (typeof window !== 'undefined' && navigator.share && typeof navigator.share === 'function') {
    return (
      <Button
        variant={variant}
        size="sm"
        onClick={handleNativeShare}
        className={showText ? 'flex items-center gap-2' : sizeClasses[size] + ' p-2'}
      >
        <Share2 className={iconSizes[size]} />
        {showText && '공유'}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={showText ? 'flex items-center gap-2' : sizeClasses[size] + ' p-2'}
        >
          <Share2 className={iconSizes[size]} />
          {showText && '공유'}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink} className="flex items-center gap-2">
          {copied ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? '복사됨!' : '링크 복사'}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleFacebookShare} className="flex items-center gap-2">
          <Facebook className="h-4 w-4 text-blue-600" />
          페이스북에 공유
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleTwitterShare} className="flex items-center gap-2">
          <Twitter className="h-4 w-4 text-blue-400" />
          트위터에 공유
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => window.open(`mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareDescription}\n\n${shareUrl}`)}`)}
          className="flex items-center gap-2"
        >
          <Link className="h-4 w-4" />
          이메일로 공유
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}