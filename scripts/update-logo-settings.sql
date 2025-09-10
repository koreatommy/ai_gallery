-- 로고 설정 업데이트 스크립트
-- 이 스크립트는 Supabase SQL Editor에서 실행하세요

-- 기존 로고 설정이 있는지 확인
SELECT * FROM site_settings WHERE key IN ('logo_text', 'logo_icon');

-- 로고 텍스트 설정 (존재하지 않으면 삽입, 존재하면 업데이트)
INSERT INTO site_settings (key, value, description) VALUES
  ('logo_text', 'AI Gallery', '사이트 로고 텍스트')
ON CONFLICT (key) DO UPDATE SET 
  value = 'AI Gallery',
  updated_at = NOW();

-- 로고 아이콘 설정 (존재하지 않으면 삽입, 존재하면 업데이트)
INSERT INTO site_settings (key, value, description) VALUES
  ('logo_icon', 'Grid3X3', '사이트 로고 아이콘')
ON CONFLICT (key) DO UPDATE SET 
  value = 'Grid3X3',
  updated_at = NOW();

-- 업데이트 후 확인
SELECT * FROM site_settings WHERE key IN ('logo_text', 'logo_icon');
