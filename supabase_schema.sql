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
  i.description,
  i.url,
  i.thumbnail_url,
  i.category_id,
  c.name as category_name,
  i.tags,
  i.created_at,
  i.updated_at,
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