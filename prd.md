
## 프로젝트 개요

AI Gallery는 온라인 이미지 갤러리 웹 애플리케이션입니다. Next.js와 Supabase를 활용한 풀스택 프로젝트로 이미지 업로드, 저장, 관리 및 갤러리 뷰를 제공합니다.

## 기술 스택

- **프론트엔드**: Next.js, React
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **백엔드**: Supabase (Database + Storage + Auth)
- **상태 관리**: React Query 또는 SWR
- **폼 처리**: React Hook Form + Zod
- **레이아웃**: React Masonry CSS
- **이미지 최적화**: Next.js Image, WebP 변환

## 핵심 아키텍처

### 이미지 관리 시스템
- Supabase Storage에 원본 및 썸네일 저장
- 이미지 메타데이터는 Supabase Database에 저장
- RLS(Row Level Security) 정책으로 접근 권한 관리

### 갤러리 인터페이스
- Masonry 레이아웃으로 Pinterest 스타일 그리드
- 무한 스크롤 또는 페이지네이션
- 라이트박스/모달로 상세 보기
- 반응형 디자인 지원

### 검색 및 필터링
- 제목, 태그, 설명 기반 검색
- 카테고리별 분류 및 태그 필터링
- 정렬 옵션 (최신순, 인기순, 이름순)

## Supabase 설정

**프로젝트 정보**:
- Project ID: kicon  
- Project Name: gallery
- Password: gallery123db

### 필요한 테이블 구조
- `images`: 이미지 메타데이터 (제목, 설명, 태그, URL 등)
- `categories`: 카테고리 정보
- `likes`: 좋아요 정보
- `comments`: 댓글 시스템

### Storage 설정
- 이미지 파일용 public 버킷
- 썸네일용 별도 버킷 또는 폴더 구조

## 개발 시 주의사항

- MCP Supabase 도구 활용 권장
- 이미지 최적화는 Next.js Image 컴포넌트 필수 사용
- 레이지 로딩과 스켈레톤 UI로 성능 최적화
- Framer Motion으로 부드러운 애니메이션 구현
- SEO를 위한 메타 태그 및 Open Graph 설정

## Git Repository

https://github.com/koreatommy/ai_gallery.git