'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestSupabase() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [details, setDetails] = useState<any>({});

  useEffect(() => {
    const testConnection = async () => {
      try {
        // 환경 변수 체크
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        
        const configDetails = {
          url: url,
          keyExists: !!key,
          keyLength: key?.length || 0,
          isValidUrl: url?.startsWith('https://') && url?.includes('.supabase.co'),
          isPlaceholder: url?.includes('placeholder') || url?.includes('dummy')
        };
        
        setDetails(configDetails);
        
        console.log('환경 변수 체크:', configDetails);
        
        // Supabase 연결 테스트
        const { data, error } = await supabase.from('categories').select('count').limit(1);
        
        if (error) {
          console.log('Supabase 에러:', error);
          setStatus('error');
          setMessage(`❌ Supabase 연결 실패: ${error.message}`);
        } else {
          setStatus('success');
          setMessage('✅ Supabase 연결 성공! 데이터베이스에 정상적으로 접근할 수 있습니다.');
        }
      } catch (err: any) {
        console.error('연결 테스트 중 에러:', err);
        setStatus('error');
        setMessage(`❌ 연결 테스트 실패: ${err.message || err}`);
      }
    };

    testConnection();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Supabase 연결 테스트</h1>
      
      <div className="space-y-6">
        <div className="border p-6 rounded-lg bg-gray-50">
          <h2 className="text-xl font-semibold mb-4">환경 변수 확인</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="font-medium">URL 설정:</p>
              <p className={`text-sm ${details.isValidUrl ? 'text-green-600' : 'text-red-600'}`}>
                {details.url ? '✅ 설정됨' : '❌ 누락'}
              </p>
              {details.url && (
                <p className="text-xs break-all bg-white p-2 rounded border">
                  {details.url}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <p className="font-medium">API Key 설정:</p>
              <p className={`text-sm ${details.keyExists ? 'text-green-600' : 'text-red-600'}`}>
                {details.keyExists ? '✅ 설정됨' : '❌ 누락'}
              </p>
              {details.keyExists && (
                <p className="text-xs bg-white p-2 rounded border">
                  길이: {details.keyLength}자
                </p>
              )}
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>참고:</strong> 프로덕션 환경에서는 Vercel 대시보드에서 환경 변수를 설정해야 합니다.
            </p>
          </div>
        </div>
        
        <div className="border p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">연결 상태</h2>
          <div className={`p-4 rounded-lg ${
            status === 'loading' ? 'bg-yellow-100 border border-yellow-300' :
            status === 'success' ? 'bg-green-100 border border-green-300' : 
            'bg-red-100 border border-red-300'
          }`}>
            <div className="flex items-center space-x-2">
              {status === 'loading' && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600"></div>}
              <span className="font-medium">
                {status === 'loading' ? '연결 테스트 중...' : message}
              </span>
            </div>
          </div>
        </div>
        
        <div className="border p-6 rounded-lg bg-blue-50">
          <h2 className="text-xl font-semibold mb-4">설정 가이드</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-medium">Vercel 환경 변수 설정:</p>
              <code className="block bg-white p-2 rounded border mt-1">
                NEXT_PUBLIC_SUPABASE_URL=https://qbpwxjullgynxpswquzb.supabase.co<br/>
                NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
              </code>
            </div>
            <div>
              <p className="font-medium">설정 후:</p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>Vercel 대시보드에서 프로젝트 설정 → Environment Variables</li>
                <li>위의 환경 변수를 추가</li>
                <li>프로젝트 재배포</li>
                <li>이 페이지에서 연결 상태 재확인</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}