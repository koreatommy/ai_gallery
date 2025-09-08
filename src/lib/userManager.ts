/**
 * 사용자 관리 유틸리티
 * 브라우저별 고유 사용자 ID 생성 및 관리
 */

const USER_ID_KEY = 'ai_gallery_user_id';
const USER_SESSION_KEY = 'ai_gallery_user_session';

export interface UserInfo {
  id: string;
  sessionId: string;
  createdAt: string;
  lastActiveAt: string;
}

class UserManager {
  private userInfo: UserInfo | null = null;

  /**
   * 사용자 정보 초기화
   */
  init(): UserInfo {
    if (typeof window === 'undefined') {
      // 서버 사이드에서는 임시 ID 반환
      return this.generateTemporaryUser();
    }

    // 기존 사용자 정보 로드
    const existingUser = this.loadUserFromStorage();
    if (existingUser) {
      this.userInfo = existingUser;
      this.updateLastActive();
      return existingUser;
    }

    // 새 사용자 생성
    const newUser = this.generateNewUser();
    this.userInfo = newUser;
    this.saveUserToStorage(newUser);
    return newUser;
  }

  /**
   * 현재 사용자 ID 가져오기
   */
  getUserId(): string {
    if (!this.userInfo) {
      this.init();
    }
    return this.userInfo?.id || this.generateTemporaryUser().id;
  }

  /**
   * 현재 사용자 정보 가져오기
   */
  getUserInfo(): UserInfo {
    if (!this.userInfo) {
      this.init();
    }
    return this.userInfo || this.generateTemporaryUser();
  }

  /**
   * 새 사용자 생성
   */
  private generateNewUser(): UserInfo {
    const now = new Date().toISOString();
    return {
      id: this.generateUUID(),
      sessionId: this.generateSessionId(),
      createdAt: now,
      lastActiveAt: now
    };
  }

  /**
   * 임시 사용자 생성 (서버 사이드용)
   */
  private generateTemporaryUser(): UserInfo {
    const now = new Date().toISOString();
    return {
      id: 'temp-' + Math.random().toString(36).substr(2, 9),
      sessionId: 'temp-session-' + Math.random().toString(36).substr(2, 9),
      createdAt: now,
      lastActiveAt: now
    };
  }

  /**
   * UUID 생성
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * 세션 ID 생성
   */
  private generateSessionId(): string {
    return 'session-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * 로컬 스토리지에서 사용자 정보 로드
   */
  private loadUserFromStorage(): UserInfo | null {
    try {
      const stored = localStorage.getItem(USER_ID_KEY);
      if (stored) {
        const userInfo = JSON.parse(stored);
        // 사용자 정보가 30일 이상 오래되었으면 새로 생성
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        if (new Date(userInfo.createdAt) < thirtyDaysAgo) {
          localStorage.removeItem(USER_ID_KEY);
          localStorage.removeItem(USER_SESSION_KEY);
          return null;
        }
        return userInfo;
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
    return null;
  }

  /**
   * 로컬 스토리지에 사용자 정보 저장
   */
  private saveUserToStorage(userInfo: UserInfo): void {
    try {
      localStorage.setItem(USER_ID_KEY, JSON.stringify(userInfo));
      localStorage.setItem(USER_SESSION_KEY, userInfo.sessionId);
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error);
    }
  }

  /**
   * 마지막 활동 시간 업데이트
   */
  private updateLastActive(): void {
    if (this.userInfo) {
      this.userInfo.lastActiveAt = new Date().toISOString();
      this.saveUserToStorage(this.userInfo);
    }
  }

  /**
   * 사용자 정보 리셋 (디버깅용)
   */
  reset(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(USER_ID_KEY);
      localStorage.removeItem(USER_SESSION_KEY);
    }
    this.userInfo = null;
  }

  /**
   * 사용자 통계 정보
   */
  getStats(): { 
    isNewUser: boolean; 
    daysSinceCreated: number; 
    sessionId: string;
  } {
    const userInfo = this.getUserInfo();
    const createdAt = new Date(userInfo.createdAt);
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      isNewUser: daysSinceCreated < 1,
      daysSinceCreated,
      sessionId: userInfo.sessionId
    };
  }
}

// 싱글톤 인스턴스
export const userManager = new UserManager();

// 초기화
if (typeof window !== 'undefined') {
  userManager.init();
}
