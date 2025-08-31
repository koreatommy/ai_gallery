import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수가 없을 때 경고 로그 출력
if (!supabaseUrl || !supabaseKey) {
  console.warn('Supabase 환경 변수가 설정되지 않았습니다. 일부 기능이 제한될 수 있습니다.');
}

// 더미 클라이언트 생성 (환경 변수가 없을 때 사용)
const createDummyClient = () => {
  return createClient('https://dummy.supabase.co', 'dummy-key');
};

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : createDummyClient();

export default supabase;