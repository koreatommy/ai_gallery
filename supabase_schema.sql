-- AI Gallery Database Schema
-- 카테고리 테이블
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이미지 테이블
CREATE TABLE images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID DEFAULT gen_random_uuid() -- 향후 사용자 시스템 추가시 사용
);

-- 좋아요 테이블
CREATE TABLE likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  user_id UUID DEFAULT gen_random_uuid(), -- 향후 사용자 시스템
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(image_id, user_id)
);

-- 댓글 테이블
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID REFERENCES images(id) ON DELETE CASCADE,
  user_id UUID DEFAULT gen_random_uuid(), -- 향후 사용자 시스템
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 이미지 통계를 위한 뷰
CREATE VIEW image_stats AS
SELECT 
  i.id,
  i.title,
  i.author,
  i.description,
  i.url,
  i.thumbnail_url,
  i.file_name,
  i.file_size,
  i.width,
  i.height,
  i.category_id,
  c.name as category_name,
  i.tags,
  i.created_at,
  i.updated_at,
  i.user_id,
  COALESCE(l.likes_count, 0) as likes_count,
  COALESCE(cm.comments_count, 0) as comments_count
FROM images i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN (
  SELECT image_id, COUNT(*) as likes_count
  FROM likes
  GROUP BY image_id
) l ON i.id = l.image_id
LEFT JOIN (
  SELECT image_id, COUNT(*) as comments_count
  FROM comments
  GROUP BY image_id
) cm ON i.id = cm.image_id;

-- 인덱스 생성
CREATE INDEX idx_images_created_at ON images(created_at DESC);
CREATE INDEX idx_images_category ON images(category_id);
CREATE INDEX idx_images_tags ON images USING GIN(tags);
CREATE INDEX idx_likes_image_id ON likes(image_id);
CREATE INDEX idx_comments_image_id ON comments(image_id);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE images ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "모든 사용자가 카테고리 읽기 가능" ON categories FOR SELECT USING (true);
CREATE POLICY "모든 사용자가 이미지 읽기 가능" ON images FOR SELECT USING (true);
CREATE POLICY "모든 사용자가 좋아요 읽기 가능" ON likes FOR SELECT USING (true);
CREATE POLICY "모든 사용자가 댓글 읽기 가능" ON comments FOR SELECT USING (true);

-- 익명 사용자도 쓰기 가능 (개발용, 실제 운영시에는 수정 필요)
CREATE POLICY "익명 사용자가 카테고리 추가 가능" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "익명 사용자가 이미지 추가 가능" ON images FOR INSERT WITH CHECK (true);
CREATE POLICY "익명 사용자가 좋아요 추가 가능" ON likes FOR INSERT WITH CHECK (true);
CREATE POLICY "익명 사용자가 댓글 추가 가능" ON comments FOR INSERT WITH CHECK (true);

-- 업데이트/삭제 정책
CREATE POLICY "익명 사용자가 이미지 수정 가능" ON images FOR UPDATE USING (true);
CREATE POLICY "익명 사용자가 이미지 삭제 가능" ON images FOR DELETE USING (true);
CREATE POLICY "익명 사용자가 댓글 수정 가능" ON comments FOR UPDATE USING (true);
CREATE POLICY "익명 사용자가 댓글 삭제 가능" ON comments FOR DELETE USING (true);
CREATE POLICY "익명 사용자가 좋아요 삭제 가능" ON likes FOR DELETE USING (true);

-- 풋터 섹션 테이블
CREATE TABLE footer_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 풋터 링크 테이블
CREATE TABLE footer_links (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES footer_sections(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  url TEXT NOT NULL,
  target VARCHAR(20) DEFAULT '_self', -- _self, _blank
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사이트 설정 테이블 (풋터 관련 설정 포함)
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 풋터 관련 인덱스
CREATE INDEX idx_footer_sections_order ON footer_sections(order_index);
CREATE INDEX idx_footer_links_section ON footer_links(section_id);
CREATE INDEX idx_footer_links_order ON footer_links(order_index);

-- 풋터 관련 RLS 정책
ALTER TABLE footer_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE footer_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "모든 사용자가 풋터 섹션 읽기 가능" ON footer_sections FOR SELECT USING (true);
CREATE POLICY "모든 사용자가 풋터 링크 읽기 가능" ON footer_links FOR SELECT USING (true);
CREATE POLICY "모든 사용자가 사이트 설정 읽기 가능" ON site_settings FOR SELECT USING (true);

-- 익명 사용자도 쓰기 가능 (개발용)
CREATE POLICY "익명 사용자가 풋터 섹션 추가 가능" ON footer_sections FOR INSERT WITH CHECK (true);
CREATE POLICY "익명 사용자가 풋터 링크 추가 가능" ON footer_links FOR INSERT WITH CHECK (true);
CREATE POLICY "익명 사용자가 사이트 설정 추가 가능" ON site_settings FOR INSERT WITH CHECK (true);

-- 업데이트/삭제 정책
CREATE POLICY "익명 사용자가 풋터 섹션 수정 가능" ON footer_sections FOR UPDATE USING (true);
CREATE POLICY "익명 사용자가 풋터 섹션 삭제 가능" ON footer_sections FOR DELETE USING (true);
CREATE POLICY "익명 사용자가 풋터 링크 수정 가능" ON footer_links FOR UPDATE USING (true);
CREATE POLICY "익명 사용자가 풋터 링크 삭제 가능" ON footer_links FOR DELETE USING (true);
CREATE POLICY "익명 사용자가 사이트 설정 수정 가능" ON site_settings FOR UPDATE USING (true);
CREATE POLICY "익명 사용자가 사이트 설정 삭제 가능" ON site_settings FOR DELETE USING (true);

-- 기본 카테고리 데이터 삽입
INSERT INTO categories (name, description) VALUES
  ('Nature', '자연 풍경 이미지'),
  ('Portrait', '인물 사진'),
  ('Architecture', '건축물 사진'),
  ('Abstract', '추상적인 예술 작품'),
  ('Street', '거리 사진'),
  ('Travel', '여행 사진'),
  ('Food', '음식 사진'),
  ('Animals', '동물 사진'),
  ('Technology', '기술 관련 이미지'),
  ('Art', '예술 작품');

-- 기본 풋터 섹션 데이터 삽입
INSERT INTO footer_sections (title, description, order_index) VALUES
  ('Company', '회사 정보', 1),
  ('Support', '고객 지원', 2),
  ('Legal', '법적 고지', 3),
  ('Social', '소셜 미디어', 4);

-- 기본 풋터 링크 데이터 삽입
INSERT INTO footer_links (section_id, title, url, target, order_index) VALUES
  ((SELECT id FROM footer_sections WHERE title = 'Company'), 'About Us', '/about', '_self', 1),
  ((SELECT id FROM footer_sections WHERE title = 'Company'), 'Contact', '/contact', '_self', 2),
  ((SELECT id FROM footer_sections WHERE title = 'Support'), 'Help Center', '/help', '_self', 1),
  ((SELECT id FROM footer_sections WHERE title = 'Support'), 'FAQ', '/faq', '_self', 2),
  ((SELECT id FROM footer_sections WHERE title = 'Legal'), 'Privacy Policy', '/privacy', '_self', 1),
  ((SELECT id FROM footer_sections WHERE title = 'Legal'), 'Terms of Service', '/terms', '_self', 2),
  ((SELECT id FROM footer_sections WHERE title = 'Social'), 'Twitter', 'https://twitter.com', '_blank', 1),
  ((SELECT id FROM footer_sections WHERE title = 'Social'), 'Facebook', 'https://facebook.com', '_blank', 2);

-- 기본 사이트 설정 데이터 삽입
INSERT INTO site_settings (key, value, description) VALUES
  ('footer_copyright', '© 2024 AI Gallery. All rights reserved.', '풋터 저작권 텍스트'),
  ('footer_show_social', 'true', '소셜 미디어 링크 표시 여부'),
  ('footer_show_newsletter', 'true', '뉴스레터 구독 표시 여부'),
  ('logo_text', 'AI Gallery', '사이트 로고 텍스트'),
  ('logo_icon', 'Grid3X3', '사이트 로고 아이콘');