# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 개요

AI Gallery는 온라인 이미지 갤러리 웹 애플리케이션입니다. Next.js 15와 Supabase를 활용한 풀스택 프로젝트로 이미지 업로드, 저장, 관리, 갤러리 뷰 및 관리자 기능을 제공합니다.

## 개발 환경 명령어

```bash
# 개발 서버 실행 (Turbopack 사용)
npm run dev

# 프로덕션 빌드
npm run build

# 프로덕션 서버 실행
npm run start

# 린트 검사
npm run lint

# 타입 체크
npx tsc --noEmit
```

## 기술 스택

- **프론트엔드**: Next.js 15 (App Router), React 19, TypeScript
- **스타일링**: Tailwind CSS 4, shadcn/ui
- **백엔드**: Supabase (Database + Storage)  
- **상태 관리**: TanStack React Query
- **폼 처리**: React Hook Form + Zod
- **애니메이션**: Framer Motion
- **레이아웃**: React Masonry CSS
- **이미지 최적화**: Next.js Image
- **아이콘**: Lucide React
- **알림**: Sonner
- **파일 업로드**: React Dropzone

## 프로젝트 구조

```
src/
├── app/              # Next.js App Router 페이지
│   ├── admin/       # 관리자 페이지 (/admin, /admin/images, /admin/categories)
│   └── page.tsx     # 메인 갤러리 페이지
├── components/       # React 컴포넌트
│   ├── ui/          # shadcn/ui 기본 컴포넌트
│   ├── gallery/     # 갤러리 핵심 기능 (업로드, 검색, 필터 등)
│   ├── admin/       # 관리자 기능 (대시보드, 이미지/카테고리 관리)
│   ├── layout/      # 레이아웃 컴포넌트
│   └── providers/   # Context providers
├── lib/             # 핵심 비즈니스 로직
│   ├── database.ts  # Supabase 데이터베이스 서비스 (imageService, categoryService 등)
│   ├── storage.ts   # Supabase Storage 서비스 (업로드, 삭제, URL 생성)
│   ├── admin.ts     # 관리자 인증 및 권한 관리
│   └── supabase.ts  # Supabase 클라이언트 설정
├── hooks/           # 커스텀 훅 (무한스크롤, 좋아요, 디바운스 등)
└── types/           # TypeScript 타입 정의
```

## 환경 변수 설정

`.env.local` 파일에 다음 변수들을 설정하세요:

```
NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=

eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk
NEXT_PUBLIC_SUPABASE_STORAGE_URL=https://qbpwxjullgynxpswquzb.supabase.co/storage/v1/object/public/images
ADMIN_PASSWORD=admin123
```

## 핵심 아키텍처

### 데이터 레이어 (`src/lib/`)
- **database.ts**: Supabase 데이터베이스 서비스 계층
  - `imageService`: 이미지 CRUD 작업 (getAll, getById, create, update, delete, search)
  - `categoryService`: 카테고리 관리 (getAll, create)
  - `likeService`: 좋아요 토글 및 카운트
  - `commentService`: 댓글 CRUD 작업
  - `image_stats` 뷰를 사용하여 좋아요/댓글 수 포함된 이미지 데이터 조회

- **storage.ts**: Supabase Storage 서비스 계층
  - 이미지 업로드 (`originals`, `thumbnails`, `temp` 폴더별)
  - 이미지 삭제 및 URL 생성
  - Supabase Transform을 사용한 썸네일 자동 생성
  - 파일 검증 및 메타데이터 추출

- **admin.ts**: 관리자 인증 시스템
  - localStorage 기반 세션 관리 (24시간 만료)
  - `AdminAuth` 클래스로 로그인/로그아웃/인증 확인
  - HOC `withAdminAuth`로 컴포넌트 보호

### 컴포넌트 아키텍처
- **갤러리 시스템**: Masonry 레이아웃 + 무한 스크롤 + 라이트박스
- **관리자 시스템**: 대시보드 + 이미지/카테고리 관리
- **상태 관리**: TanStack React Query로 서버 상태 관리
- **UI 컴포넌트**: shadcn/ui 기반 일관된 디자인 시스템

## 데이터베이스 스키마

### 주요 테이블
- **images**: 이미지 메타데이터 (제목, 설명, 태그, URL, 크기 정보)
- **categories**: 카테고리 정보 (이름, 설명)  
- **likes**: 좋아요 시스템 (이미지별 좋아요 관리)
- **comments**: 댓글 시스템 (이미지별 댓글)
- **image_stats**: 통계 뷰 (좋아요/댓글 수 포함된 이미지 데이터)

### Storage 구조
- **Bucket**: `images`
- **폴더 구조**: 
  - `originals/`: 원본 이미지
  - `thumbnails/`: 썸네일 (현재는 Supabase Transform 사용)
  - `temp/`: 임시 파일

### RLS 정책
- 모든 테이블에서 읽기 허용
- 개발용으로 익명 사용자 쓰기 허용 (운영시 수정 필요)

## 관리자 기능

### 접근 방법
1. `/admin` 페이지 접속
2. 비밀번호 입력: `admin123`
3. 24시간 세션 유지

### 관리 기능
- **대시보드** (`/admin`): 전체 통계, 최근 업로드, 인기 카테고리/이미지
- **이미지 관리** (`/admin/images`): 이미지 목록, 검색, 정렬, 삭제
- **카테고리 관리** (`/admin/categories`): 카테고리 생성, 목록 (수정/삭제는 구현 예정)

## 주요 개발 패턴

### 서비스 레이어 사용
```typescript
// 데이터베이스 작업시 서비스 레이어 사용
import { imageService, categoryService } from '@/lib/database';
const images = await imageService.getAll(20, 0);
```

### React Query 패턴
```typescript
// 커스텀 훅에서 React Query 사용
const { data, isLoading, error } = useQuery({
  queryKey: ['images', searchQuery, categoryId],
  queryFn: () => imageService.search(searchQuery)
});
```

### Supabase Transform 활용
- 썸네일은 업로드시 별도 생성하지 않고 `storageService.getThumbnailUrl()` 사용
- 실시간 리사이징으로 다양한 크기 지원

## Git Repository

https://github.com/koreatommy/ai_gallery.git