#!/bin/bash

# Vercel 환경 변수 설정 스크립트
echo "🚀 Vercel 환경 변수 설정을 시작합니다..."

# Supabase URL 설정
echo "📝 NEXT_PUBLIC_SUPABASE_URL 설정 중..."
vercel env add NEXT_PUBLIC_SUPABASE_URL production <<< "https://qbpwxjullgynxpswquzb.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_URL preview <<< "https://qbpwxjullgynxpswquzb.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_URL development <<< "https://qbpwxjullgynxpswquzb.supabase.co"

# Supabase Anon Key 설정
echo "📝 NEXT_PUBLIC_SUPABASE_ANON_KEY 설정 중..."
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development <<< "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk"

# Storage URL 설정
echo "📝 NEXT_PUBLIC_SUPABASE_STORAGE_URL 설정 중..."
vercel env add NEXT_PUBLIC_SUPABASE_STORAGE_URL production <<< "https://qbpwxjullgynxpswquzb.supabase.co/storage/v1/object/public/images"
vercel env add NEXT_PUBLIC_SUPABASE_STORAGE_URL preview <<< "https://qbpwxjullgynxpswquzb.supabase.co/storage/v1/object/public/images"
vercel env add NEXT_PUBLIC_SUPABASE_STORAGE_URL development <<< "https://qbpwxjullgynxpswquzb.supabase.co/storage/v1/object/public/images"

echo "✅ 환경 변수 설정이 완료되었습니다!"
echo "🔄 프로젝트를 재배포합니다..."

# 프로젝트 재배포
vercel --prod

echo "🎉 배포가 완료되었습니다!"
echo "🔗 배포된 사이트: https://ai-gallery-tau.vercel.app/"
echo "🔗 연결 테스트: https://ai-gallery-tau.vercel.app/test-supabase"
