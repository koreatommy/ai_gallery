# Vercel 배포 가이드 - Supabase 환경 변수 설정

## 🚀 배포 전 필수 설정

이 프로젝트를 Vercel에 배포하기 전에 다음 환경 변수를 설정해야 합니다.

### 1. 로컬 환경 변수 확인

프로젝트 루트에서 다음 명령어로 환경 변수를 확인할 수 있습니다:

```bash
npm run check-env
```

또는

```bash
node scripts/check-env.js
```

### 2. Vercel 대시보드에서 환경 변수 설정

1. [Vercel 대시보드](https://vercel.com/dashboard)에 로그인
2. `ai_gallery` 프로젝트 선택
3. **Settings** → **Environment Variables** 클릭
4. 다음 환경 변수를 추가:

#### 필수 환경 변수

```bash
# Supabase 프로젝트 URL
NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co

# Supabase Anonymous Key
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk
```

### 3. 환경 변수 설정 방법

1. **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://qbpwxjullgynxpswquzb.supabase.co`
   - **Environment**: Production, Preview, Development 모두 선택

2. **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk`
   - **Environment**: Production, Preview, Development 모두 선택

### 4. 배포 후 확인

환경 변수 설정 후:

1. **프로젝트 재배포** (자동으로 트리거됨)
2. 배포 완료 후 [https://ai-gallery-tau.vercel.app/test-supabase](https://ai-gallery-tau.vercel.app/test-supabase) 방문
3. 연결 상태가 "✅ Supabase 연결 성공!"으로 표시되는지 확인

## 🔧 문제 해결

### 연결 실패 시 확인사항

1. **환경 변수 이름 확인**
   - `NEXT_PUBLIC_` 접두사가 정확히 포함되어 있는지 확인
   - 대소문자 구분 확인

2. **값 확인**
   - URL이 `https://`로 시작하는지 확인
   - API 키가 올바른 형식인지 확인

3. **배포 확인**
   - 환경 변수 설정 후 새로운 배포가 완료되었는지 확인
   - Vercel 대시보드에서 배포 로그 확인

### 로컬 개발 환경

로컬에서 개발할 때는 `.env.local` 파일을 생성하고 동일한 환경 변수를 설정:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk
```

### 환경 변수 확인 명령어

```bash
# 로컬 환경 변수 확인
npm run check-env

# 또는 직접 실행
node scripts/check-env.js
```

## 📊 데이터베이스 상태

현재 Supabase 데이터베이스 상태:
- **프로젝트**: gallery
- **지역**: ap-northeast-2 (서울)
- **상태**: ACTIVE_HEALTHY
- **카테고리**: 5개
- **이미지**: 8개
- **테이블**: categories, images, likes, comments, image_stats (뷰)

## 🔗 유용한 링크

- [Supabase 프로젝트 대시보드](https://supabase.com/dashboard/project/qbpwxjullgynxpswquzb)
- [Vercel 프로젝트 대시보드](https://vercel.com/dashboard)
- [배포된 사이트](https://ai-gallery-tau.vercel.app/)
- [연결 테스트 페이지](https://ai-gallery-tau.vercel.app/test-supabase)
