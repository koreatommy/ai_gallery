'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // 환경 변수 체크
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        console.log('환경 변수 체크:');
        console.log('URL:', url ? '✅ 설정됨' : '❌ 누락');
        console.log('Key:', key ? '✅ 설정됨' : '❌ 누락');
        
        // Supabase 연결 테스트
        const { data, error } = await supabase.from('_test').select('*').limit(1);
        
        if (error) {
          console.log('Supabase 에러:', error.message);
          if (error.message.includes('relation "_test" does not exist')) {
            setStatus('success');
            setMessage('✅ Supabase 연결 성공! (테스트 테이블이 없어서 에러가 나는 것은 정상입니다.)');
          } else {
            setStatus('error');
            setMessage(`❌ Supabase 연결 실패: ${error.message}`);
          }
        } else {
          setStatus('success');
          setMessage('✅ Supabase 연결 성공!');
        }
      } catch (err) {
        console.error('연결 테스트 중 에러:', err);
        setStatus('error');
        setMessage(`❌ 연결 테스트 실패: ${err}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 테스트</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">환경 변수 확인</h2>
          <div className="space-y-2 text-sm">
            <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ 설정됨' : '❌ 누락'}</p>
            <p>Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ 설정됨' : '❌ 누락'}</p>
            {process.env.NEXT_PUBLIC_SUPABASE_URL && (
              <p className="break-all">URL: {process.env.NEXT_PUBLIC_SUPABASE_URL}</p>
            )}
          </div>
        </div>
        
        <div className="border p-4 rounded">
          <h2 className="text-xl font-semibold mb-2">연결 상태</h2>
          <div className={`p-2 rounded ${
            status === 'loading' ? 'bg-yellow-100' :
            status === 'success' ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {status === 'loading' ? '연결 테스트 중...' : message}
          </div>
        </div>
      </div>
    </div>
  );
}