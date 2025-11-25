-- image_stats 뷰 업데이트: file_size, width, height, file_name, author 필드 추가
DROP VIEW IF EXISTS image_stats;

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

