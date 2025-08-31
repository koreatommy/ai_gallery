# Supabase Storage 설정 가이드

## Storage 버킷 생성

### 1. Supabase 대시보드에서 Storage 설정

1. [Supabase 대시보드](https://supabase.com/dashboard) → 프로젝트 선택
2. 좌측 메뉴에서 "Storage" 선택
3. "Create bucket" 버튼 클릭

### 2. Images 버킷 생성

- **Bucket name**: `images`
- **Public**: ✅ 체크 (공개 접근 가능)
- **File size limit**: 10MB (필요시 조정)
- **Allowed file types**: `image/*`

### 3. 폴더 구조

```
images/
├── originals/     # 원본 이미지
├── thumbnails/    # 썸네일 이미지
└── temp/          # 임시 업로드 폴더
```

### 4. Storage 정책 설정

#### RLS 정책 (필요시)
```sql
-- 모든 사용자가 이미지를 읽을 수 있도록
CREATE POLICY "Public read access on images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'images');

-- 익명 사용자도 업로드 가능 (개발용)
CREATE POLICY "Public upload access on images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'images');

-- 삭제 권한 (개발용)
CREATE POLICY "Public delete access on images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'images');
```

## 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk

# Storage Configuration
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://qbpwxjullgynxpswquzb.supabase.co/storage/v1/object/public/images
```

**중요**: 환경 변수를 설정한 후 개발 서버를 재시작해야 합니다.

## Storage 헬퍼 함수 생성

파일 경로: `src/lib/storage.ts`
- 이미지 업로드 함수
- 썸네일 생성 함수  
- 이미지 삭제 함수
- URL 생성 함수