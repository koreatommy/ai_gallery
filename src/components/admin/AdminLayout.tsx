'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Shield, 
  BarChart3, 
  Image as ImageIcon, 
  Tag, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Home,
  Eye,
  Database,
  Activity,
  FileText,
  Bell,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Palette,
  Monitor,
  Layout
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AdminAuth } from '@/lib/admin';

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: string | number;
  description?: string;
  subItems?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: BarChart3,
    href: '/admin',
    description: '전체 현황 및 통계'
  },
  {
    id: 'content',
    label: '컨텐츠관리',
    icon: FolderOpen,
    href: '/admin/content',
    description: '컨텐츠 생성 및 관리',
    subItems: [
      {
        id: 'logo',
        label: '로고관리',
        icon: Palette,
        href: '/admin/content/logo',
        description: '로고 이미지 관리'
      },
      {
        id: 'hero',
        label: '히어로섹션관리',
        icon: Monitor,
        href: '/admin/content/hero',
        description: '메인 히어로 섹션 관리'
      },
      {
        id: 'footer',
        label: '풋터관리',
        icon: Layout,
        href: '/admin/content/footer',
        description: '사이트 풋터 관리'
      }
    ]
  },
  {
    id: 'images',
    label: '이미지 관리',
    icon: ImageIcon,
    href: '/admin/images',
    description: '이미지 업로드 및 관리'
  },
  {
    id: 'categories',
    label: '카테고리 관리',
    icon: Tag,
    href: '/admin/categories',
    description: '카테고리 생성 및 편집'
  },
  {
    id: 'analytics',
    label: '분석',
    icon: Activity,
    href: '/admin/analytics',
    description: '사용자 활동 및 통계'
  },
  {
    id: 'users',
    label: '사용자 관리',
    icon: Users,
    href: '/admin/users',
    description: '사용자 계정 관리'
  },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    href: '/admin/settings',
    description: '시스템 설정'
  }
];

export default function AdminLayout({ children, title, description }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const authenticated = AdminAuth.isAuthenticated();
    if (authenticated) {
      setIsAuthenticated(true);
    } else {
      router.push('/admin');
    }
  }, [router]);

  // 현재 경로에 따라 서브 메뉴 자동 확장
  useEffect(() => {
    const currentMenuItem = menuItems.find(item => 
      item.subItems?.some(subItem => subItem.href === pathname)
    );
    if (currentMenuItem && !expandedMenus.includes(currentMenuItem.id)) {
      setExpandedMenus(prev => [...prev, currentMenuItem.id]);
    }
  }, [pathname, expandedMenus]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      AdminAuth.logout();
      setIsAuthenticated(false);
      // 약간의 지연을 두어 사용자에게 피드백 제공
      await new Promise(resolve => setTimeout(resolve, 500));
      router.push('/admin');
    } catch (error) {
      console.error('로그아웃 중 오류 발생:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleMenuClick = (href: string, isSubMenu: boolean = false) => {
    router.push(href);
    // 서브 메뉴가 아닌 경우에만 사이드바 닫기 (모바일에서)
    if (!isSubMenu) {
      setSidebarOpen(false);
    }
  };

  const toggleSubMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const isSubMenuExpanded = (menuId: string) => {
    return expandedMenus.includes(menuId);
  };

  const isSubMenuActive = (subItems: MenuItem[]) => {
    return subItems.some(item => pathname === item.href);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">인증이 필요합니다...</p>
        </div>
      </div>
    );
  }

  const currentMenuItem = menuItems.find(item => pathname === item.href);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 모바일 사이드바 오버레이 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* 로고 및 헤더 */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">AI Gallery</h1>
                <p className="text-xs text-gray-500">관리자 패널</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* 메뉴 */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              const hasSubItems = item.subItems && item.subItems.length > 0;
              const hasActiveSubMenu = hasSubItems && item.subItems ? isSubMenuActive(item.subItems) : false;
              const isExpanded = isSubMenuExpanded(item.id);
              const Icon = item.icon;
              
              return (
                <div key={item.id} className="space-y-1">
                  <button
                    onClick={() => {
                      if (hasSubItems) {
                        toggleSubMenu(item.id);
                      } else {
                        handleMenuClick(item.href);
                      }
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isActive || hasActiveSubMenu
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive || hasActiveSubMenu ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{item.label}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                      )}
                    </div>
                    {hasSubItems && (
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    )}
                  </button>
                  
                  {/* 서브 메뉴 */}
                  {hasSubItems && isExpanded && (
                    <div className="ml-6 space-y-1">
                      {item.subItems!.map((subItem) => {
                        const isSubActive = pathname === subItem.href;
                        const SubIcon = subItem.icon;
                        
                        return (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem.href, true)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                            isSubActive
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                            <SubIcon className={`w-4 h-4 ${isSubActive ? 'text-blue-600' : 'text-gray-400'}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">{subItem.label}</span>
                                {subItem.badge && (
                                  <Badge variant="secondary" className="text-xs">
                                    {subItem.badge}
                                  </Badge>
                                )}
                              </div>
                              {subItem.description && (
                                <p className="text-xs text-gray-500 truncate">{subItem.description}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* 하단 액션 */}
          <div className="p-4 border-t space-y-2">
            <Button
              onClick={() => window.open('/', '_blank')}
              variant="ghost"
              className="w-full justify-start gap-3"
            >
              <Eye className="w-4 h-4" />
              사이트 보기
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              disabled={isLoggingOut}
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className={`w-4 h-4 ${isLoggingOut ? 'animate-spin' : ''}`} />
              {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
            </Button>
          </div>
        </div>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="lg:pl-72">
        {/* 상단 헤더 */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </Button>
              
              <div>
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
                {description && (
                  <p className="text-sm text-gray-600">{description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* 알림 */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="w-5 h-5" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-1 -right-1 w-5 h-5 text-xs p-0 flex items-center justify-center"
                >
                  3
                </Badge>
              </Button>

              {/* 현재 시간 */}
              <div className="hidden sm:block text-sm text-gray-500">
                {new Date().toLocaleDateString('ko-KR', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
