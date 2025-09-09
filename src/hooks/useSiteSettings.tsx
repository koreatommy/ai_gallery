'use client';

import { useState, useEffect } from 'react';
import { siteSettingsService } from '@/lib/database';

/**
 * 사이트 설정을 관리하는 훅
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await siteSettingsService.getAll();
      setSettings(data);
    } catch (err) {
      console.error('사이트 설정 로드 실패:', err);
      setError('사이트 설정을 불러오는데 실패했습니다.');
      // 기본값 설정
      setSettings({ logo_text: 'AI Gallery' });
    } finally {
      setIsLoading(false);
    }
  };

  const getSetting = (key: string, defaultValue: string = ''): string => {
    return settings[key] || defaultValue;
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    getSetting,
    reload: loadSettings
  };
}

/**
 * 로고 텍스트만 가져오는 훅
 */
export function useLogoText() {
  const { getSetting, isLoading, error } = useSiteSettings();
  
  return {
    logoText: getSetting('logo_text', 'AI Gallery'),
    isLoading,
    error
  };
}

/**
 * 로고 아이콘만 가져오는 훅
 */
export function useLogoIcon() {
  const { getSetting, isLoading, error } = useSiteSettings();
  
  return {
    logoIcon: getSetting('logo_icon', 'Grid3X3'),
    isLoading,
    error
  };
}

/**
 * 로고 설정을 모두 가져오는 훅
 */
export function useLogoSettings() {
  const { getSetting, isLoading, error } = useSiteSettings();
  
  return {
    logoText: getSetting('logo_text', 'AI Gallery'),
    logoIcon: getSetting('logo_icon', 'Grid3X3'),
    isLoading,
    error
  };
}
