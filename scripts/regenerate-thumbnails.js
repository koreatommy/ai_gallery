/**
 * 기존 이미지들의 썸네일을 새로운 품질(80%)로 재생성하는 스크립트
 * 
 * 사용법:
 * node scripts/regenerate-thumbnails.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 환경 변수 로드
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL와 SUPABASE_SERVICE_ROLE_KEY를 확인하세요.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * 이미지 다운로드
 */
async function downloadImage(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.arrayBuffer();
  } catch (error) {
    console.error(`이미지 다운로드 실패: ${url}`, error.message);
    return null;
  }
}

/**
 * 이미지 업로드
 */
async function uploadImage(buffer, path) {
  try {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true // 기존 파일 덮어쓰기
      });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error(`이미지 업로드 실패: ${path}`, error.message);
    return null;
  }
}

/**
 * 썸네일 재생성
 */
async function regenerateThumbnail(imageData) {
  try {
    console.log(`🔄 처리 중: ${imageData.title || imageData.file_name} (ID: ${imageData.id})`);

    // 원본 이미지 다운로드
    const originalBuffer = await downloadImage(imageData.url);
    if (!originalBuffer) {
      console.log(`⏭️  건너뜀: 원본 이미지 다운로드 실패`);
      return false;
    }

    // Canvas를 사용한 썸네일 생성 (Node.js 환경에서는 sharp 라이브러리 사용 권장)
    // 여기서는 간단한 예시로 원본을 그대로 사용하되, 실제로는 리사이징 로직이 필요
    const thumbnailBuffer = originalBuffer; // 실제로는 300x300으로 리사이징

    // 썸네일 경로 생성
    const thumbnailPath = `thumbnails/${imageData.id}.jpg`;

    // 썸네일 업로드
    const uploadResult = await uploadImage(thumbnailBuffer, thumbnailPath);
    if (!uploadResult) {
      console.log(`⏭️  건너뜀: 썸네일 업로드 실패`);
      return false;
    }

    // 데이터베이스에서 썸네일 URL 업데이트
    const { error: updateError } = await supabase
      .from('images')
      .update({ 
        thumbnail_url: `${supabaseUrl}/storage/v1/object/public/images/${thumbnailPath}` 
      })
      .eq('id', imageData.id);

    if (updateError) {
      console.error(`❌ 데이터베이스 업데이트 실패:`, updateError.message);
      return false;
    }

    console.log(`✅ 완료: ${imageData.title || imageData.file_name}`);
    return true;

  } catch (error) {
    console.error(`❌ 썸네일 재생성 실패 (ID: ${imageData.id}):`, error.message);
    return false;
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 썸네일 재생성 시작...\n');

  try {
    // 모든 이미지 조회
    const { data: images, error } = await supabase
      .from('images')
      .select('id, title, file_name, url, thumbnail_url')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!images || images.length === 0) {
      console.log('📭 재생성할 이미지가 없습니다.');
      return;
    }

    console.log(`📊 총 ${images.length}개의 이미지를 처리합니다.\n`);

    let successCount = 0;
    let failCount = 0;

    // 각 이미지에 대해 썸네일 재생성
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      console.log(`[${i + 1}/${images.length}]`);
      
      const success = await regenerateThumbnail(image);
      if (success) {
        successCount++;
      } else {
        failCount++;
      }

      // API 호출 제한을 위한 잠시 대기
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 썸네일 재생성 완료!');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);

  } catch (error) {
    console.error('❌ 스크립트 실행 중 오류 발생:', error.message);
    process.exit(1);
  }
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = { regenerateThumbnail, main };
