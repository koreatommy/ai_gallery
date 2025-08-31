import { MetadataRoute } from 'next';
import { imageService } from '@/lib/database';
import { SEOService } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 기본 사이트맵 반환 (빌드 시 에러 방지)
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-gallery.vercel.app';
  
  const defaultSitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/admin`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ];

  // 환경 변수가 없으면 기본 sitemap 반환
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn('Supabase 환경 변수가 설정되지 않아 기본 sitemap을 생성합니다.');
    return defaultSitemap;
  }

  try {
    // 최신 이미지들 가져오기 (sitemap에 포함할 용도)
    const images = await imageService.getAll(100, 0);
    
    // SEO 서비스를 통해 URL 생성
    const urls = SEOService.generateSitemapUrls(images);
    
    return urls.map(url => ({
      url: url.url,
      lastModified: url.lastModified,
      changeFrequency: url.changeFrequency as 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never',
      priority: url.priority,
    }));
  } catch (error) {
    console.error('Sitemap 생성 실패:', error);
    return defaultSitemap;
  }
}