import type { Metadata } from 'next';
import type { Image } from '@/types';

interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  images?: string[];
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  authors?: string[];
  siteName?: string;
  locale?: string;
}

export class SEOService {
  private static readonly DEFAULT_TITLE = 'AI Gallery - 이미지 갤러리';
  private static readonly DEFAULT_DESCRIPTION = '아름다운 이미지를 업로드하고 공유할 수 있는 AI 갤러리입니다. 드래그 앤 드롭으로 쉽게 업로드하고, 카테고리별로 분류하며, 검색과 필터링 기능을 통해 원하는 이미지를 빠르게 찾을 수 있습니다.';
  private static readonly DEFAULT_KEYWORDS = ['이미지 갤러리', 'AI Gallery', '사진 업로드', '이미지 공유', '사진 갤러리', 'Next.js', 'Supabase'];
  private static readonly SITE_NAME = 'AI Gallery';
  private static readonly BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://localhost:3000';

  static generateMetadata(config: SEOConfig): Metadata {
    const {
      title,
      description,
      keywords = [],
      images = [],
      type = 'website',
      publishedTime,
      modifiedTime,
      authors = [],
      siteName = this.SITE_NAME,
      locale = 'ko_KR'
    } = config;

    const fullTitle = title === this.DEFAULT_TITLE ? title : `${title} | ${this.SITE_NAME}`;
    const allKeywords = [...this.DEFAULT_KEYWORDS, ...keywords];

    return {
      title: fullTitle,
      description,
      keywords: allKeywords.join(', '),
      authors: authors.map(name => ({ name })),
      creator: this.SITE_NAME,
      publisher: this.SITE_NAME,
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      openGraph: {
        type,
        locale,
        url: this.BASE_URL,
        title: fullTitle,
        description,
        siteName,
        images: images.map(image => ({
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        })),
        ...(publishedTime && { publishedTime }),
        ...(modifiedTime && { modifiedTime }),
      },
      twitter: {
        card: 'summary_large_image',
        title: fullTitle,
        description,
        images: images,
        creator: '@AIGallery',
        site: '@AIGallery',
      },
      alternates: {
        canonical: this.BASE_URL,
      },
      other: {
        'theme-color': '#ffffff',
        'color-scheme': 'light dark',
        'format-detection': 'telephone=no',
      },
    };
  }

  static generateHomeMetadata(): Metadata {
    return this.generateMetadata({
      title: this.DEFAULT_TITLE,
      description: this.DEFAULT_DESCRIPTION,
      keywords: ['홈페이지', '메인', 'home'],
    });
  }

  static generateImageDetailMetadata(image: Image): Metadata {
    const imageUrl = image.thumbnail_url || image.url;
    const description = image.description || `${image.title} - ${this.DEFAULT_DESCRIPTION}`;
    
    return this.generateMetadata({
      title: image.title,
      description,
      keywords: [...(image.tags || []), '이미지 상세'],
      images: [imageUrl],
      type: 'article',
      publishedTime: image.created_at,
      modifiedTime: image.updated_at,
    });
  }

  static generateCategoryMetadata(categoryName: string, categoryDescription?: string): Metadata {
    return this.generateMetadata({
      title: `${categoryName} 카테고리`,
      description: categoryDescription || `${categoryName} 카테고리의 이미지들을 확인해보세요. ${this.DEFAULT_DESCRIPTION}`,
      keywords: [categoryName, '카테고리', '분류'],
    });
  }

  static generateSearchMetadata(query: string, resultsCount?: number): Metadata {
    const title = `"${query}" 검색 결과`;
    const description = resultsCount 
      ? `"${query}" 검색 결과 ${resultsCount.toLocaleString()}개의 이미지를 찾았습니다.`
      : `"${query}"와 관련된 이미지를 검색해보세요.`;

    return this.generateMetadata({
      title,
      description,
      keywords: [query, '검색', '이미지 검색'],
    });
  }

  static generateUploadMetadata(): Metadata {
    return this.generateMetadata({
      title: '이미지 업로드',
      description: '새로운 이미지를 업로드하고 갤러리에 추가해보세요. 드래그 앤 드롭으로 간편하게 업로드할 수 있습니다.',
      keywords: ['이미지 업로드', '사진 업로드', '파일 업로드'],
    });
  }

  static generateStructuredData(image?: Image) {
    const baseStructuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: this.SITE_NAME,
      description: this.DEFAULT_DESCRIPTION,
      url: this.BASE_URL,
      potentialAction: {
        '@type': 'SearchAction',
        target: `${this.BASE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string'
      }
    };

    if (image) {
      return {
        ...baseStructuredData,
        '@type': 'ImageObject',
        name: image.title,
        description: image.description || image.title,
        contentUrl: image.url,
        thumbnailUrl: image.thumbnail_url,
        uploadDate: image.created_at,
        keywords: image.tags?.join(', '),
        width: image.width,
        height: image.height,
        encodingFormat: this.getImageFormat(image.url),
        creator: {
          '@type': 'Organization',
          name: this.SITE_NAME
        }
      };
    }

    return baseStructuredData;
  }

  static generateBreadcrumbStructuredData(breadcrumbs: Array<{ name: string; url: string }>) {
    return {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.url
      }))
    };
  }

  private static getImageFormat(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    const formatMap: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'webp': 'image/webp',
      'gif': 'image/gif'
    };
    return formatMap[extension || ''] || 'image/jpeg';
  }

  static generateRobotsTxt(): string {
    return `
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${this.BASE_URL}/sitemap.xml
    `.trim();
  }

  static generateSitemapUrls(images: Image[]): Array<{ url: string; lastModified: Date; changeFrequency: string; priority: number }> {
    const urls = [
      {
        url: this.BASE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0
      },
      {
        url: `${this.BASE_URL}/upload`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.8
      }
    ];

    // 이미지 상세 페이지 추가
    images.forEach(image => {
      urls.push({
        url: `${this.BASE_URL}/image/${image.id}`,
        lastModified: new Date(image.updated_at),
        changeFrequency: 'monthly',
        priority: 0.6
      });
    });

    return urls;
  }
}