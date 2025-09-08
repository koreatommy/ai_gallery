// 관리자 권한 관리 유틸리티

export const ADMIN_CONFIG = {
  // 관리자 비밀번호 (환경변수에서 가져오기)
  PASSWORD: process.env.ADMIN_PASSWORD || '',
  // 세션 만료 시간 (24시간)
  SESSION_DURATION: 24 * 60 * 60 * 1000,
} as const;

export interface AdminSession {
  isAuthenticated: boolean;
  loginTime: number;
  expiresAt: number;
}

export class AdminAuth {
  private static readonly STORAGE_KEY = 'adminAuth';
  private static readonly SESSION_KEY = 'adminSession';

  /**
   * 관리자 로그인
   */
  static login(password: string): boolean {
    if (password === ADMIN_CONFIG.PASSWORD) {
      const now = Date.now();
      const session: AdminSession = {
        isAuthenticated: true,
        loginTime: now,
        expiresAt: now + ADMIN_CONFIG.SESSION_DURATION,
      };

      if (typeof window !== 'undefined') {
        localStorage.setItem(this.STORAGE_KEY, 'true');
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
      
      return true;
    }
    return false;
  }

  /**
   * 관리자 로그아웃
   */
  static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
      localStorage.removeItem(this.SESSION_KEY);
    }
  }

  /**
   * 현재 인증 상태 확인
   */
  static isAuthenticated(): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    const authStatus = localStorage.getItem(this.STORAGE_KEY);
    const sessionData = localStorage.getItem(this.SESSION_KEY);

    if (!authStatus || !sessionData) {
      return false;
    }

    try {
      const session: AdminSession = JSON.parse(sessionData);
      
      // 세션 만료 확인
      if (Date.now() > session.expiresAt) {
        this.logout();
        return false;
      }

      return session.isAuthenticated;
    } catch {
      this.logout();
      return false;
    }
  }

  /**
   * 세션 정보 가져오기
   */
  static getSession(): AdminSession | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const sessionData = localStorage.getItem(this.SESSION_KEY);
    if (!sessionData) {
      return null;
    }

    try {
      const session: AdminSession = JSON.parse(sessionData);
      
      // 세션 만료 확인
      if (Date.now() > session.expiresAt) {
        this.logout();
        return null;
      }

      return session;
    } catch {
      this.logout();
      return null;
    }
  }

  /**
   * 세션 갱신
   */
  static refreshSession(): boolean {
    if (!this.isAuthenticated()) {
      return false;
    }

    const now = Date.now();
    const session: AdminSession = {
      isAuthenticated: true,
      loginTime: Date.now(),
      expiresAt: now + ADMIN_CONFIG.SESSION_DURATION,
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    return true;
  }

  /**
   * 남은 세션 시간 (분 단위)
   */
  static getRemainingTime(): number {
    const session = this.getSession();
    if (!session) {
      return 0;
    }

    const remaining = session.expiresAt - Date.now();
    return Math.max(0, Math.floor(remaining / (1000 * 60)));
  }
}

import React from 'react';

/**
 * 관리자 권한이 필요한 컴포넌트를 위한 HOC
 */
export function withAdminAuth<P extends object>(
  WrappedComponent: React.ComponentType<P>
) {
  return function AdminProtectedComponent(props: P) {
    const [isAuthenticated, setIsAuthenticated] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(true);

    React.useEffect(() => {
      const checkAuth = () => {
        const authenticated = AdminAuth.isAuthenticated();
        setIsAuthenticated(authenticated);
        setIsLoading(false);
      };

      checkAuth();

      // 주기적으로 세션 상태 확인
      const interval = setInterval(checkAuth, 60000); // 1분마다
      
      return () => clearInterval(interval);
    }, []);

    if (isLoading) {
      return React.createElement('div', {
        className: "min-h-screen bg-gray-50 flex items-center justify-center"
      }, React.createElement('div', {
        className: "text-center"
      }, [
        React.createElement('div', {
          key: 'spinner',
          className: "animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
        }),
        React.createElement('p', {
          key: 'text',
          className: "text-gray-600"
        }, "인증 확인 중...")
      ]));
    }

    if (!isAuthenticated) {
      if (typeof window !== 'undefined') {
        window.location.href = '/admin';
      }
      return null;
    }

    return React.createElement(WrappedComponent, props);
  };
}