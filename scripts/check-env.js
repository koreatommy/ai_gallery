#!/usr/bin/env node

/**
 * 환경 변수 확인 및 검증 스크립트
 * 로컬 및 배포 환경에서 Supabase 설정을 확인합니다.
 */

// Next.js 환경 변수 로딩
require('dotenv').config({ path: '.env.local' });

const requiredEnvVars = {
  NEXT_PUBLIC_SUPABASE_URL: {
    required: true,
    pattern: /^https:\/\/[a-zA-Z0-9-]+\.supabase\.co$/,
    description: 'Supabase 프로젝트 URL'
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    required: true,
    pattern: /^eyJ[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/,
    description: 'Supabase Anonymous Key'
  }
};

function checkEnvironmentVariables() {
  console.log('🔍 환경 변수 확인 중...\n');
  
  let allValid = true;
  const results = {};
  
  for (const [key, config] of Object.entries(requiredEnvVars)) {
    const value = process.env[key];
    const exists = !!value;
    const isValid = exists && config.pattern.test(value);
    
    results[key] = {
      exists,
      isValid,
      value: exists ? `${value.substring(0, 20)}...` : 'undefined',
      description: config.description
    };
    
    if (!exists) {
      console.log(`❌ ${key}: 설정되지 않음`);
      console.log(`   설명: ${config.description}`);
      allValid = false;
    } else if (!isValid) {
      console.log(`⚠️  ${key}: 잘못된 형식`);
      console.log(`   값: ${value}`);
      console.log(`   설명: ${config.description}`);
      allValid = false;
    } else {
      console.log(`✅ ${key}: 정상`);
      console.log(`   값: ${value.substring(0, 50)}...`);
    }
    console.log('');
  }
  
  // 현재 환경 정보
  console.log('📋 환경 정보:');
  console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'undefined'}`);
  console.log(`   Platform: ${process.platform}`);
  console.log(`   Node Version: ${process.version}`);
  console.log('');
  
  if (allValid) {
    console.log('🎉 모든 환경 변수가 올바르게 설정되었습니다!');
    return true;
  } else {
    console.log('❌ 환경 변수 설정에 문제가 있습니다.');
    console.log('\n📝 해결 방법:');
    console.log('1. .env.local 파일에 다음 내용을 추가하세요:');
    console.log('');
    console.log('NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFicHd4anVsbGd5bnhwc3dxdXpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0NTM0NjgsImV4cCI6MjA3MjAyOTQ2OH0.1eEF0fpxm-6BIhSRwdFSM7gzHw0JHGQO1h8sHyL77qk');
    console.log('');
    console.log('2. Vercel 배포 환경에서는 Vercel 대시보드에서 환경 변수를 설정하세요.');
    return false;
  }
}

// 스크립트 실행
if (require.main === module) {
  const isValid = checkEnvironmentVariables();
  process.exit(isValid ? 0 : 1);
}

module.exports = { checkEnvironmentVariables };
