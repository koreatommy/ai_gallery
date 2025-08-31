import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 설정되지 않은 경우 빌드 시 에러 방지
let supabase: any = null;

try {
  if (supabaseUrl && supabaseKey && supabaseUrl.trim() && supabaseKey.trim()) {
    supabase = createClient(supabaseUrl, supabaseKey);
  } else {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다. 빌드는 계속 진행됩니다.');
  }
} catch (error) {
  console.warn('Supabase 클라이언트 초기화 실패:', error);
}

export { supabase };
export default supabase;