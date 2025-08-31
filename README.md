# AI Gallery

AI 생성 이미지를 위한 갤러리 애플리케이션입니다. Next.js, Supabase, TypeScript를 사용하여 구축되었습니다.

## 주요 기능

- 🖼️ 이미지 업로드 및 갤러리 표시
- 🔍 카테고리별 필터링 및 검색
- ❤️ 좋아요 및 댓글 기능
- 📱 반응형 디자인
- ⚡ 실시간 업데이트

## 기술 스택

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Storage, Auth)
- **UI**: shadcn/ui 컴포넌트
- **상태관리**: React Query

## 시작하기

### 1. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk

# Storage Configuration
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://qbpwxjullgynxpswquzb.supabase.co/storage/v1/object/public/images
```

### 2. 환경 변수 확인

환경 변수가 올바르게 설정되었는지 확인:

```bash
npm run check-env
```

### 3. 의존성 설치

```bash
npm install
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 데이터베이스 설정

Supabase 데이터베이스는 이미 설정되어 있습니다. 자세한 설정 내용은 다음 파일을 참조하세요:

- `database_setup.md` - 데이터베이스 스키마 설정
- `storage_setup.md` - Storage 버킷 설정
- `supabase_schema.sql` - 데이터베이스 스키마

## 프로젝트 구조

```
src/
├── app/                 # Next.js App Router
├── components/          # React 컴포넌트
│   ├── gallery/        # 갤러리 관련 컴포넌트
│   ├── ui/             # UI 컴포넌트
│   └── layout/         # 레이아웃 컴포넌트
├── hooks/              # 커스텀 훅
├── lib/                # 유틸리티 및 설정
└── types/              # TypeScript 타입 정의
```

## 배포

### Vercel 배포

이 프로젝트는 Vercel에 배포할 수 있습니다. 자세한 배포 가이드는 `VERCEL_DEPLOYMENT_GUIDE.md`를 참조하세요.

### 환경 변수 설정 (Vercel)

Vercel 대시보드에서 다음 환경 변수를 설정해야 합니다:

1. **Settings** → **Environment Variables**
2. 다음 변수들을 추가:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 배포 후 확인

배포 완료 후 [https://ai-gallery-tau.vercel.app/test-supabase](https://ai-gallery-tau.vercel.app/test-supabase)에서 Supabase 연결 상태를 확인할 수 있습니다.

## 유용한 명령어

```bash
# 개발 서버 실행
npm run dev

# 프로덕션 빌드
npm run build

# 환경 변수 확인
npm run check-env

# 린트 검사
npm run lint
```

## 문제 해결

### Supabase 연결 문제

1. 환경 변수가 올바르게 설정되었는지 확인:
   ```bash
   npm run check-env
   ```

2. 연결 테스트 페이지 방문:
   - 로컬: http://localhost:3000/test-supabase
   - 배포: https://ai-gallery-tau.vercel.app/test-supabase

3. 자세한 문제 해결 가이드는 `VERCEL_DEPLOYMENT_GUIDE.md`를 참조하세요.
