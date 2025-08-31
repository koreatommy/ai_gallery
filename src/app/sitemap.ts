import { MetadataRoute } from 'next';
import { imageService } from '@/lib/database';
import { SEOService } from '@/lib/seo';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 환경 변수 체크
  const isConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
                      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://dummy.supabase.co';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ai-gallery-example.vercel.app';

  if (!isConfigured) {
    console.warn('Supabase가 설정되지 않았습니다. 기본 사이트맵을 반환합니다.');
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
    ];
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
    
    // 기본 사이트맵 반환
    return [
      {
        url: baseUrl,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1,
      },
      {
        url: `${baseUrl}/upload`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8,
      },
    ];
  }
}