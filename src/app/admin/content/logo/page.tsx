'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { siteSettingsService } from '@/lib/database';
import { toast } from 'sonner';
import { Save, RefreshCw } from 'lucide-react';
import { 
  Grid3X3, Image, Images, GalleryVertical, Camera, ImageIcon, Home, Building, School, 
  GraduationCap, BookOpen, Users, Heart, Star, Award, Trophy, Circle, Square, 
  Triangle, Diamond, Hexagon 
} from 'lucide-react';

// 사용 가능한 아이콘 목록
const availableIcons = [
  { name: 'Grid3X3', component: Grid3X3, label: '3x3 격자 (현재)' },
  { name: 'Image', component: Image, label: '이미지' },
  { name: 'Images', component: Images, label: '여러 이미지' },
  { name: 'GalleryVertical', component: GalleryVertical, label: '갤러리' },
  { name: 'Camera', component: Camera, label: '카메라' },
  { name: 'ImageIcon', component: ImageIcon, label: '이미지 아이콘' },
  { name: 'Home', component: Home, label: '홈' },
  { name: 'Building', component: Building, label: '건물' },
  { name: 'School', component: School, label: '학교' },
  { name: 'GraduationCap', component: GraduationCap, label: '졸업모자' },
  { name: 'BookOpen', component: BookOpen, label: '열린 책' },
  { name: 'Users', component: Users, label: '사용자들' },
  { name: 'Heart', component: Heart, label: '하트' },
  { name: 'Star', component: Star, label: '별' },
  { name: 'Award', component: Award, label: '상' },
  { name: 'Trophy', component: Trophy, label: '트로피' },
  { name: 'Circle', component: Circle, label: '원' },
  { name: 'Square', component: Square, label: '사각형' },
  { name: 'Triangle', component: Triangle, label: '삼각형' },
  { name: 'Diamond', component: Diamond, label: '다이아몬드' },
  { name: 'Hexagon', component: Hexagon, label: '육각형' },
];

export default function LogoManagementPage() {
  const [logoText, setLogoText] = useState('');
  const [logoIcon, setLogoIcon] = useState('Grid3X3');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 로고 설정 로드
  const loadLogoSettings = async () => {
    setIsLoading(true);
    try {
      const [text, icon] = await Promise.all([
        siteSettingsService.get('logo_text'),
        siteSettingsService.get('logo_icon')
      ]);
      setLogoText(text || '');
      setLogoIcon(icon || 'Grid3X3');
    } catch (error) {
      console.error('로고 설정 로드 실패:', error);
      toast.error('로고 설정을 불러오는데 실패했습니다.');
      setLogoText('');
      setLogoIcon('Grid3X3');
    } finally {
      setIsLoading(false);
    }
  };

  // 로고 설정 저장
  const saveLogoSettings = async () => {
    if (!logoText.trim()) {
      toast.error('로고 텍스트를 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      console.log('로고 설정 저장 시작:', { text: logoText.trim(), icon: logoIcon });
      await Promise.all([
        siteSettingsService.set('logo_text', logoText.trim(), '사이트 상단 로고 텍스트'),
        siteSettingsService.set('logo_icon', logoIcon, '사이트 상단 로고 아이콘')
      ]);
      console.log('로고 설정 저장 완료');
      toast.success('로고 설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('로고 설정 저장 실패:', error);
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      toast.error(`로고 설정 저장에 실패했습니다: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 컴포넌트 마운트 시 로고 설정 로드
  useEffect(() => {
    loadLogoSettings();
  }, []);

  return (
    <AdminLayout 
      title="로고관리" 
      description="로고 텍스트 및 아이콘 관리"
    >
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              로고 설정 관리
            </CardTitle>
            <CardDescription>
              갤러리 상단에 표시되는 로고 텍스트와 아이콘을 변경할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="logo-text">로고 텍스트</Label>
              <Input
                id="logo-text"
                value={logoText}
                onChange={(e) => setLogoText(e.target.value)}
                placeholder="로고 텍스트를 입력하세요"
                disabled={isLoading}
                maxLength={50}
              />
              <p className="text-sm text-gray-500">
                현재 텍스트: <span className="font-medium">{logoText || '설정되지 않음'}</span>
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="logo-icon">로고 아이콘</Label>
              <Select value={logoIcon} onValueChange={setLogoIcon} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="아이콘을 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {availableIcons.map((icon) => {
                    const IconComponent = icon.component;
                    return (
                      <SelectItem key={icon.name} value={icon.name}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4" />
                          <span>{icon.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                현재 아이콘: <span className="font-medium">{availableIcons.find(i => i.name === logoIcon)?.label || 'Grid3X3'}</span>
              </p>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={saveLogoSettings}
                disabled={isSaving || isLoading}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? '저장 중...' : '저장'}
              </Button>
              
              <Button 
                variant="outline"
                onClick={loadLogoSettings}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                새로고침
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
            <CardDescription>
              변경된 로고 텍스트와 아이콘이 어떻게 표시되는지 확인할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  {(() => {
                    const selectedIcon = availableIcons.find(icon => icon.name === logoIcon);
                    const IconComponent = selectedIcon?.component || Grid3X3;
                    return <IconComponent className="w-5 h-5 text-white" />;
                  })()}
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {logoText || '로고 텍스트'}
                </h1>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
