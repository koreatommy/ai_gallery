# AI Gallery

AI 생성 이미지를 위한 갤러리 애플리케이션입니다. Next.js, Supabase, TypeScript를 사용하여 구축되었습니다.

## 주요 기능

- 🖼️ 이미지 업로드 및 갤러리 표시
- 🔍 카테고리별 필터링 및 검색
- ❤️ 개선된 좋아요 시스템 (사용자별 고유 ID, 낙관적 업데이트)
- 📱 반응형 디자인
- ⚡ 실시간 업데이트
- 📄 전통적인 페이징 시스템 (20개씩)
- 👨‍💼 관리자 대시보드 (이미지/카테고리 관리, 통계)

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

# Admin Configuration (운영환경에서는 반드시 강력한 비밀번호로 변경하세요)
ADMIN_PASSWORD=your_secure_admin_password
```

### 2. 보안 설정

**⚠️ 중요: 운영환경 배포 전 보안 설정**

1. **관리자 비밀번호 변경**: `.env.local` 파일에서 `ADMIN_PASSWORD`를 강력한 비밀번호로 변경하세요.
2. **환경변수 보호**: `.env.local` 파일은 절대 Git에 커밋하지 마세요.
3. **기본 비밀번호**: 개발환경에서만 `admin123`이 기본값으로 사용됩니다.

### 3. 환경 변수 확인

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

## 최근 업데이트 (2025년 1월)

### 🖼️ 이미지 품질 개선
- **썸네일 품질 향상**: 70% → 80% 품질로 썸네일 화질 개선
- **자동 최적화**: 새로 업로드되는 모든 이미지에 80% 품질 자동 적용
- **Supabase Transform**: 실시간 이미지 리사이징 및 품질 최적화
- **관리자 페이지 최적화**: `useImageOptimization` 훅을 통한 썸네일 URL 최적화

### 🎨 갤러리 기능 개선
- **갤러리보기 섹션**: 메인 페이지에 새로운 "갤러리보기" 섹션 헤더 추가
- **페이징 시스템**: 무한 스크롤을 전통적인 페이징으로 변경 (20개씩, 페이지 번호 표시)
- **성능 최적화**: `usePagination` 훅으로 더 효율적인 데이터 로딩

### 🔧 관리자 기능 강화
- **이미지 카테고리 관리**: 관리자 대시보드에서 개별 이미지의 카테고리 변경 가능
- **고급 검색**: 이미지 관리 페이지에서 카테고리별 필터링 기능 추가
- **정확한 통계**: 카테고리별 이미지 수량을 서버사이드에서 정확하게 계산
- **통계 대시보드**: 총 카테고리, 활성 카테고리, 총 이미지 통계 표시
- **UI 간소화**: 불필요한 썸네일 업데이트 버튼 제거로 관리자 페이지 정리

### ❤️ 좋아요 시스템 대폭 개선
- **사용자별 고유 ID**: 브라우저별 고유 사용자 ID 생성 및 관리
- **즉시 반응**: 클릭 시 즉시 UI 업데이트 (낙관적 업데이트)
- **안정성**: 실패 시 자동 롤백으로 일관성 유지
- **중복 방지**: 로딩 상태로 중복 클릭 방지
- **향상된 UX**: 명확한 성공/실패 메시지, 로딩 상태 표시

### 🛠️ 기술적 개선사항
- **새로운 사용자 관리**: `UserManager` 클래스로 브라우저별 사용자 추적
- **강화된 에러 처리**: 모든 좋아요 관련 작업에 상세한 에러 처리
- **실시간 동기화**: 서버와 클라이언트 상태 일치 보장
- **코드 품질**: 더 나은 타입 안전성과 에러 핸들링
- **이미지 최적화**: `useImageOptimization` 훅으로 통합된 이미지 처리

### 🦶 풋터 관리 시스템 (2025년 1월 신규)
- **동적 풋터**: 데이터베이스 기반 풋터 섹션 및 링크 관리
- **관리자 인터페이스**: 직관적인 풋터 섹션 및 링크 편집 기능
- **실시간 미리보기**: 관리자 페이지에서 풋터 변경사항 실시간 확인
- **설정 관리**: 저작권 텍스트, 소셜 미디어 표시 등 풋터 설정 관리
- **반응형 디자인**: 모바일 및 데스크톱에서 최적화된 풋터 표시
- **자동 테스트**: Playwright를 통한 풋터 관리 기능 자동화 테스트
