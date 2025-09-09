import type { Image } from '@/types';

export interface ShareData {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
}

export class ShareUtils {
  static generateShareData(image: Image, baseUrl: string = ''): ShareData {
    const url = `${baseUrl}?image=${image.id}`;
    return {
      title: image.title,
      description: image.description || `${image.title} - AI Gallery`,
      url,
      imageUrl: image.thumbnail_url || image.url
    };
  }

  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('클립보드 복사 실패:', error);
      return false;
    }
  }

  static async nativeShare(shareData: ShareData): Promise<boolean> {
    if (!navigator.share) {
      return false;
    }

    try {
      await navigator.share({
        title: shareData.title,
        text: shareData.description,
        url: shareData.url
      });
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // 사용자가 취소한 경우
        return false;
      }
      console.error('네이티브 공유 실패:', error);
      return false;
    }
  }

  static openFacebookShare(shareData: ShareData): void {
    const params = new URLSearchParams({
      u: shareData.url,
      quote: shareData.description
    });
    const url = `https://www.facebook.com/sharer/sharer.php?${params.toString()}`;
    this.openPopup(url);
  }

  static openTwitterShare(shareData: ShareData): void {
    const params = new URLSearchParams({
      text: shareData.title,
      url: shareData.url,
      hashtags: 'AIGallery,이미지갤러리'
    });
    const url = `https://twitter.com/intent/tweet?${params.toString()}`;
    this.openPopup(url);
  }

  static openLinkedInShare(shareData: ShareData): void {
    const params = new URLSearchParams({
      url: shareData.url,
      title: shareData.title,
      summary: shareData.description
    });
    const url = `https://www.linkedin.com/sharing/share-offsite/?${params.toString()}`;
    this.openPopup(url);
  }

  static openKakaoShare(shareData: ShareData): void {
    // 카카오톡 공유는 SDK가 필요하므로 일반적인 URL로 대체
    const params = new URLSearchParams({
      url: shareData.url,
      text: `${shareData.title}\n${shareData.description}`
    });
    const url = `https://story.kakao.com/share?${params.toString()}`;
    this.openPopup(url);
  }

  static openEmailShare(shareData: ShareData): void {
    const subject = encodeURIComponent(shareData.title);
    const body = encodeURIComponent(`${shareData.description}\n\n${shareData.url}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  static openWhatsAppShare(shareData: ShareData): void {
    const text = encodeURIComponent(`${shareData.title}\n${shareData.description}\n${shareData.url}`);
    const url = `https://wa.me/?text=${text}`;
    window.open(url);
  }

  static openTelegramShare(shareData: ShareData): void {
    const params = new URLSearchParams({
      url: shareData.url,
      text: `${shareData.title}\n${shareData.description}`
    });
    const url = `https://t.me/share/url?${params.toString()}`;
    this.openPopup(url);
  }

  private static openPopup(url: string, width = 600, height = 400): void {
    // 모바일에서는 새 탭으로 열기
    if (window.innerWidth <= 768) {
      window.open(url, '_blank');
      return;
    }
    
    const left = (screen.width - width) / 2;
    const top = (screen.height - height) / 2;
    
    window.open(
      url,
      'share',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
    );
  }

  static generateMetaTags(shareData: ShareData): string {
    return `
<!-- Open Graph -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${shareData.title}" />
<meta property="og:description" content="${shareData.description}" />
<meta property="og:url" content="${shareData.url}" />
${shareData.imageUrl ? `<meta property="og:image" content="${shareData.imageUrl}" />` : ''}

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${shareData.title}" />
<meta name="twitter:description" content="${shareData.description}" />
${shareData.imageUrl ? `<meta name="twitter:image" content="${shareData.imageUrl}" />` : ''}
    `.trim();
  }

  static canUseNativeShare(): boolean {
    return typeof navigator !== 'undefined' && 'share' in navigator;
  }

  static canUseClipboard(): boolean {
    return typeof navigator !== 'undefined' && 'clipboard' in navigator;
  }
}