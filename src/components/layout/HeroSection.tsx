'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Sparkles, Camera, Image, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  onUploadClick?: () => void;
}

export default function HeroSection({ onUploadClick }: HeroSectionProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // 영상 자동 재생 보장
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.log('자동 재생 실패:', error);
        // 자동 재생이 실패한 경우 사용자 상호작용 후 재생
      });
    }
  }, []);

  const scrollToGallery = () => {
    const gallerySection = document.getElementById('gallery-section');
    if (gallerySection) {
      gallerySection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="relative h-[60vh] min-h-[500px] max-h-[700px] overflow-hidden">
      {/* 배경 영상 */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          poster="/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-video.webm" type="video/webm" />
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        
        {/* 영상 위 어두운 오버레이 */}
        <div className="absolute inset-0 bg-black/50" />
        
        {/* 그라데이션 오버레이 (선택사항) */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-pink-800/30" />
      </div>

      {/* 콘텐츠 */}
      <div className="relative z-10 flex items-center justify-center h-full px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* 아이콘 애니메이션 */}
          <div className={`flex justify-center space-x-4 mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full animate-bounce" style={{animationDelay: '0s'}}>
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full animate-bounce" style={{animationDelay: '0.2s'}}>
              <Image className="w-8 h-8 text-white" />
            </div>
            <div className="flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full animate-bounce" style={{animationDelay: '0.4s'}}>
              <Palette className="w-8 h-8 text-white" />
            </div>
          </div>

          {/* 메인 타이틀 */}
          <h1 className={`text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="bg-gradient-to-r from-yellow-200 via-pink-200 to-blue-200 bg-clip-text text-transparent animate-pulse">
              AI 생성형 이미지 컨테스트
            </span>
          </h1>

          {/* 서브 타이틀 */}
          <p className={`text-lg md:text-xl lg:text-2xl text-white/90 mb-8 transition-all duration-1000 delay-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <span className="flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
              여러분 폰에 저장되어 있는 생성형 이미지를 올려 주세요
              <Sparkles className="w-5 h-5 text-yellow-300 animate-spin" />
            </span>
          </p>

          {/* 설명 텍스트 */}
          <p className={`text-base md:text-lg text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed transition-all duration-1000 delay-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            AI가 생성한 놀라운 이미지들을 탐색하고, 좋아하는 작품에 좋아요를 누르고, 
            댓글로 소통하며 창의적인 영감을 얻어보세요.
          </p>

          {/* CTA 버튼 */}
          <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 transition-all duration-1000 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white px-8 py-6 rounded-full text-lg font-semibold shadow-2xl hover:shadow-pink-500/25 transition-all duration-300 transform hover:scale-105"
              onClick={scrollToGallery}
            >
              갤러리 둘러보기
            </Button>
            
            <Button
              size="lg"
              className="bg-white/20 border-2 border-white/60 text-white hover:bg-white hover:text-gray-900 px-8 py-6 rounded-full text-lg font-semibold backdrop-blur-sm transition-all duration-300 transform hover:scale-105 shadow-lg"
              onClick={onUploadClick || scrollToGallery}
            >
              작품 업로드하기
            </Button>
          </div>
        </div>
      </div>

      {/* 스크롤 다운 인디케이터 */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
        <button
          onClick={scrollToGallery}
          className="flex flex-col items-center text-white/80 hover:text-white transition-colors duration-300 group"
        >
          <span className="text-sm mb-2 group-hover:animate-pulse">둘러보기</span>
          <ChevronDown className="w-6 h-6 animate-bounce" />
        </button>
      </div>
    </section>
  );
}