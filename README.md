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
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Storage Configuration
NEXT_PUBLIC_SUPABASE_STORAGE_URL=your_supabase_storage_url

# Admin Configuration
ADMIN_PASSWORD=your_admin_password
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 개발 서버 실행

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

이 프로젝트는 Vercel에 배포할 수 있습니다. 자세한 내용은 [Next.js 배포 문서](https://nextjs.org/docs/app/building-your-application/deploying)를 참조하세요.
