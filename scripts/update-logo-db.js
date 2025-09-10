#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateLogoSettings() {
  console.log('🔍 기존 로고 설정 확인 중...');
  
  // 기존 설정 확인
  const { data: existingSettings, error: selectError } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['logo_text', 'logo_icon']);

  if (selectError) {
    console.error('❌ 기존 설정 조회 실패:', selectError);
    return;
  }

  console.log('📋 기존 설정:', existingSettings);

  // 로고 텍스트 업데이트/삽입
  console.log('🔄 로고 텍스트 설정 중...');
  const { error: logoTextError } = await supabase
    .from('site_settings')
    .upsert({
      key: 'logo_text',
      value: 'AI Gallery',
      description: '사이트 로고 텍스트',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });

  if (logoTextError) {
    console.error('❌ 로고 텍스트 설정 실패:', logoTextError);
  } else {
    console.log('✅ 로고 텍스트 설정 완료: AI Gallery');
  }

  // 로고 아이콘 업데이트/삽입
  console.log('🔄 로고 아이콘 설정 중...');
  const { error: logoIconError } = await supabase
    .from('site_settings')
    .upsert({
      key: 'logo_icon',
      value: 'Grid3X3',
      description: '사이트 로고 아이콘',
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'key'
    });

  if (logoIconError) {
    console.error('❌ 로고 아이콘 설정 실패:', logoIconError);
  } else {
    console.log('✅ 로고 아이콘 설정 완료: Grid3X3');
  }

  // 업데이트 후 확인
  console.log('🔍 업데이트 결과 확인 중...');
  const { data: updatedSettings, error: finalSelectError } = await supabase
    .from('site_settings')
    .select('*')
    .in('key', ['logo_text', 'logo_icon']);

  if (finalSelectError) {
    console.error('❌ 결과 확인 실패:', finalSelectError);
  } else {
    console.log('📋 업데이트된 설정:');
    updatedSettings.forEach(setting => {
      console.log(`  ${setting.key}: ${setting.value}`);
    });
  }

  console.log('🎉 로고 설정 업데이트 완료!');
}

updateLogoSettings().catch(console.error);
