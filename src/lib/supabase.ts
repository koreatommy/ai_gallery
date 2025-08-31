import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 환경 변수 검증 함수
const isValidSupabaseConfig = () => {
  return supabaseUrl && 
         supabaseKey && 
         !supabaseUrl.includes('placeholder') && 
         !supabaseUrl.includes('dummy') &&
         supabaseUrl.startsWith('https://') &&
         supabaseUrl.includes('.supabase.co');
};

// 환경 변수 검증
if (!isValidSupabaseConfig()) {
  console.error('❌ Supabase 환경 변수가 올바르게 설정되지 않았습니다.');
  console.error('필요한 환경 변수:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL: https://your-project-id.supabase.co');
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY: your-anon-key');
  
  if (process.env.NODE_ENV === 'production') {
    console.error('프로덕션 환경에서는 올바른 Supabase 설정이 필요합니다.');
  }
}

// Supabase 클라이언트 생성
export const supabase = isValidSupabaseConfig() 
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createClient('https://dummy.supabase.co', 'dummy-key');

export default supabase;