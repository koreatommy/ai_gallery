# Supabase 데이터베이스 설정 가이드

## 1. Supabase 대시보드에서 SQL 실행

1. [Supabase 대시보드](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 (kicon/gallery)
3. 좌측 메뉴에서 "SQL Editor" 선택
4. 새 쿼리 생성
5. `supabase_schema.sql` 파일의 내용을 복사하여 붙여넣기
6. "Run" 버튼 클릭하여 실행

## 2. 또는 psql을 통해 직접 연결

```bash
# Connection string 형태 (Supabase 대시보드 > Settings > Database에서 확인)
psql "postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres"
```

## 3. 스키마 생성 후 확인사항

### 테이블 확인
- `categories` - 카테고리 정보
- `images` - 이미지 메타데이터  
- `likes` - 좋아요 정보
- `comments` - 댓글 정보

### 뷰 확인
- `image_stats` - 이미지 통계 (좋아요, 댓글 수 포함)

### 기본 카테고리 데이터
- Nature, Portrait, Architecture, Abstract, Street, Travel, Food, Animals, Technology, Art

### RLS 정책 확인
- 모든 테이블에 읽기 권한 활성화
- 개발용으로 쓰기 권한도 활성화 (운영시에는 수정 필요)

## 4. Storage 버킷 생성 (다음 단계)

Supabase 대시보드에서:
1. Storage 메뉴 선택
2. "Create bucket" 클릭
3. 버킷 이름: `images`
4. Public bucket으로 설정
5. 썸네일용 폴더 구조 생성