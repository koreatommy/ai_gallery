'use client';

import { useState, useEffect } from 'react';
import { FooterService } from '@/lib/footer';
import { FooterSectionWithLinks, SiteSetting } from '@/types';
import { ExternalLink, Mail } from 'lucide-react';

interface FooterProps {
  className?: string;
}

/**
 * 사이트 풋터 컴포넌트
 * 데이터베이스에서 풋터 설정을 가져와 동적으로 렌더링
 */
export default function Footer({ className }: FooterProps) {
  const [sections, setSections] = useState<FooterSectionWithLinks[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFooterData();
  }, []);

  const loadFooterData = async () => {
    try {
      const [sectionsData, settingsData] = await Promise.all([
        FooterService.getFooterSectionsWithLinks(),
        FooterService.getSiteSettings()
      ]);

      setSections(sectionsData);
      
      // 설정을 객체로 변환
      const settingsObj: Record<string, string> = {};
      settingsData.forEach(setting => {
        settingsObj[setting.key] = setting.value || '';
      });
      setSettings(settingsObj);
    } catch (error) {
      console.error('풋터 데이터 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <footer className={`bg-gray-900 text-white py-8 ${className}`}>
        <div className="container mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="space-y-1">
                    <div className="h-3 bg-gray-700 rounded w-full"></div>
                    <div className="h-3 bg-gray-700 rounded w-5/6"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={`bg-gray-900 text-white py-12 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {sections.map((section) => (
            <div key={section.id} className="space-y-4">
              <h3 className="text-lg font-semibold text-white">
                {section.title}
              </h3>
              {section.description && (
                <p className="text-gray-400 text-sm">
                  {section.description}
                </p>
              )}
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      target={link.target}
                      rel={link.target === '_blank' ? 'noopener noreferrer' : undefined}
                      className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-1"
                    >
                      {link.title}
                      {link.target === '_blank' && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* 뉴스레터 구독 섹션 */}
        {settings.footer_show_newsletter === 'true' && (
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="max-w-md mx-auto text-center">
              <h3 className="text-lg font-semibold mb-2">뉴스레터 구독</h3>
              <p className="text-gray-400 text-sm mb-4">
                최신 업데이트와 새로운 이미지를 받아보세요.
              </p>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="이메일 주소"
                  className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors duration-200 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  구독
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 저작권 정보 */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              {settings.footer_copyright || '© 2024 AI Gallery. All rights reserved.'}
            </p>
            
            {/* 소셜 미디어 링크 */}
            {settings.footer_show_social === 'true' && (
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">Follow us:</span>
                <div className="flex gap-3">
                  {sections
                    .find(s => s.title === 'Social')
                    ?.links.filter(link => link.is_active)
                    .map((link) => (
                      <a
                        key={link.id}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-white transition-colors duration-200"
                        aria-label={link.title}
                      >
                        <ExternalLink className="h-5 w-5" />
                      </a>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
