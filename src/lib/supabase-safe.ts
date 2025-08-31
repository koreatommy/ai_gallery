// 빌드 시 안전한 Supabase 클라이언트
import { createClient } from '@supabase/supabase-js';

// 빌드 시 에러 방지를 위한 안전한 Supabase 클라이언트
const createSafeSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // 환경 변수가 없거나 빈 문자열인 경우 null 반환
  if (!supabaseUrl || !supabaseKey || !supabaseUrl.trim() || !supabaseKey.trim()) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다.');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('Supabase 클라이언트 생성 실패:', error);
    return null;
  }
};

export const supabase = createSafeSupabaseClient();
export default supabase;
