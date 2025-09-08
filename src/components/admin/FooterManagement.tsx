'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FooterService } from '@/lib/footer';
import { FooterSection, FooterLink, SiteSetting } from '@/types';
import { Plus, Edit, Trash2, GripVertical, ExternalLink, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface FooterManagementProps {
  className?: string;
}

/**
 * 풋터 관리 컴포넌트
 * 풋터 섹션과 링크를 관리할 수 있는 관리자 인터페이스
 */
export default function FooterManagement({ className }: FooterManagementProps) {
  const [sections, setSections] = useState<FooterSection[]>([]);
  const [links, setLinks] = useState<FooterLink[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState<FooterSection | null>(null);
  
  // 섹션 관리 상태
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<FooterSection | null>(null);
  const [sectionForm, setSectionForm] = useState({
    title: '',
    description: '',
    order_index: 0,
    is_active: true
  });

  // 링크 관리 상태
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<FooterLink | null>(null);
  const [linkForm, setLinkForm] = useState({
    title: '',
    url: '',
    target: '_self' as '_self' | '_blank',
    order_index: 0,
    is_active: true
  });

  // 설정 관리 상태
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    footer_copyright: '',
    footer_show_social: 'true',
    footer_show_newsletter: 'true'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sectionsData, settingsData] = await Promise.all([
        FooterService.getAllFooterSections(),
        FooterService.getSiteSettings()
      ]);
      
      setSections(sectionsData);
      setSiteSettings(settingsData);
      
      // 설정 폼 초기화
      const copyrightSetting = settingsData.find(s => s.key === 'footer_copyright');
      const socialSetting = settingsData.find(s => s.key === 'footer_show_social');
      const newsletterSetting = settingsData.find(s => s.key === 'footer_show_newsletter');
      
      setSettingsForm({
        footer_copyright: copyrightSetting?.value || '',
        footer_show_social: socialSetting?.value || 'true',
        footer_show_newsletter: newsletterSetting?.value || 'true'
      });
    } catch (error) {
      toast.error('데이터 로드 실패: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const loadLinksForSection = async (sectionId: string) => {
    try {
      const linksData = await FooterService.getFooterLinksBySection(sectionId);
      setLinks(linksData);
    } catch (error) {
      toast.error('링크 로드 실패: ' + (error as Error).message);
    }
  };

  const handleSectionSelect = (section: FooterSection) => {
    setSelectedSection(section);
    loadLinksForSection(section.id);
  };

  const handleCreateSection = async () => {
    try {
      const newSection = await FooterService.createFooterSection(sectionForm);
      setSections(prev => [...prev, newSection].sort((a, b) => a.order_index - b.order_index));
      setIsSectionDialogOpen(false);
      setSectionForm({ title: '', description: '', order_index: 0, is_active: true });
      toast.success('섹션이 생성되었습니다.');
    } catch (error) {
      toast.error('섹션 생성 실패: ' + (error as Error).message);
    }
  };

  const handleUpdateSection = async () => {
    if (!editingSection) return;
    
    try {
      const updatedSection = await FooterService.updateFooterSection(editingSection.id, sectionForm);
      setSections(prev => prev.map(s => s.id === updatedSection.id ? updatedSection : s));
      setIsSectionDialogOpen(false);
      setEditingSection(null);
      setSectionForm({ title: '', description: '', order_index: 0, is_active: true });
      toast.success('섹션이 업데이트되었습니다.');
    } catch (error) {
      toast.error('섹션 업데이트 실패: ' + (error as Error).message);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm('이 섹션을 삭제하시겠습니까? 포함된 모든 링크도 삭제됩니다.')) return;
    
    try {
      await FooterService.deleteFooterSection(id);
      setSections(prev => prev.filter(s => s.id !== id));
      if (selectedSection?.id === id) {
        setSelectedSection(null);
        setLinks([]);
      }
      toast.success('섹션이 삭제되었습니다.');
    } catch (error) {
      toast.error('섹션 삭제 실패: ' + (error as Error).message);
    }
  };

  const handleCreateLink = async () => {
    if (!selectedSection) return;
    
    try {
      const newLink = await FooterService.createFooterLink({
        ...linkForm,
        section_id: selectedSection.id
      });
      setLinks(prev => [...prev, newLink].sort((a, b) => a.order_index - b.order_index));
      setIsLinkDialogOpen(false);
      setLinkForm({ title: '', url: '', target: '_self', order_index: 0, is_active: true });
      toast.success('링크가 생성되었습니다.');
    } catch (error) {
      toast.error('링크 생성 실패: ' + (error as Error).message);
    }
  };

  const handleUpdateLink = async () => {
    if (!editingLink) return;
    
    try {
      const updatedLink = await FooterService.updateFooterLink(editingLink.id, linkForm);
      setLinks(prev => prev.map(l => l.id === updatedLink.id ? updatedLink : l));
      setIsLinkDialogOpen(false);
      setEditingLink(null);
      setLinkForm({ title: '', url: '', target: '_self', order_index: 0, is_active: true });
      toast.success('링크가 업데이트되었습니다.');
    } catch (error) {
      toast.error('링크 업데이트 실패: ' + (error as Error).message);
    }
  };

  const handleDeleteLink = async (id: string) => {
    if (!confirm('이 링크를 삭제하시겠습니까?')) return;
    
    try {
      await FooterService.deleteFooterLink(id);
      setLinks(prev => prev.filter(l => l.id !== id));
      toast.success('링크가 삭제되었습니다.');
    } catch (error) {
      toast.error('링크 삭제 실패: ' + (error as Error).message);
    }
  };

  const handleSaveSettings = async () => {
    try {
      // 각 설정을 순차적으로 저장하여 오류를 더 정확히 파악
      await FooterService.upsertSiteSetting('footer_copyright', settingsForm.footer_copyright, '풋터 저작권 텍스트');
      await FooterService.upsertSiteSetting('footer_show_social', settingsForm.footer_show_social, '소셜 미디어 링크 표시 여부');
      await FooterService.upsertSiteSetting('footer_show_newsletter', settingsForm.footer_show_newsletter, '뉴스레터 구독 표시 여부');
      
      setIsSettingsDialogOpen(false);
      toast.success('설정이 저장되었습니다.');
      loadData();
    } catch (error) {
      console.error('설정 저장 오류:', error);
      toast.error('설정 저장 실패: ' + (error as Error).message);
    }
  };

  const openSectionDialog = (section?: FooterSection) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        title: section.title,
        description: section.description || '',
        order_index: section.order_index,
        is_active: section.is_active
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        title: '',
        description: '',
        order_index: sections.length,
        is_active: true
      });
    }
    setIsSectionDialogOpen(true);
  };

  const openLinkDialog = (link?: FooterLink) => {
    if (link) {
      setEditingLink(link);
      setLinkForm({
        title: link.title,
        url: link.url,
        target: link.target,
        order_index: link.order_index,
        is_active: link.is_active
      });
    } else {
      setEditingLink(null);
      setLinkForm({
        title: '',
        url: '',
        target: '_self',
        order_index: links.length,
        is_active: true
      });
    }
    setIsLinkDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">풋터 관리</h2>
          <p className="text-gray-600">사이트 풋터의 섹션과 링크를 관리합니다.</p>
        </div>
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>풋터 설정</DialogTitle>
              <DialogDescription>풋터 관련 설정을 관리합니다.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="copyright">저작권 텍스트</Label>
                <Input
                  id="copyright"
                  value={settingsForm.footer_copyright}
                  onChange={(e) => setSettingsForm(prev => ({ ...prev, footer_copyright: e.target.value }))}
                  placeholder="© 2024 AI Gallery. All rights reserved."
                />
              </div>
              <div>
                <Label htmlFor="show_social">소셜 미디어 표시</Label>
                <Select
                  value={settingsForm.footer_show_social}
                  onValueChange={(value) => setSettingsForm(prev => ({ ...prev, footer_show_social: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">표시</SelectItem>
                    <SelectItem value="false">숨김</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="show_newsletter">뉴스레터 표시</Label>
                <Select
                  value={settingsForm.footer_show_newsletter}
                  onValueChange={(value) => setSettingsForm(prev => ({ ...prev, footer_show_newsletter: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">표시</SelectItem>
                    <SelectItem value="false">숨김</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                취소
              </Button>
              <Button onClick={handleSaveSettings}>
                저장
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 섹션 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              풋터 섹션
              <Button size="sm" onClick={() => openSectionDialog()}>
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </CardTitle>
            <CardDescription>풋터에 표시될 섹션들을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sections.map((section) => (
                <div
                  key={section.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSection?.id === section.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleSectionSelect(section)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{section.title}</h4>
                        <Badge variant={section.is_active ? 'default' : 'secondary'}>
                          {section.is_active ? '활성' : '비활성'}
                        </Badge>
                      </div>
                      {section.description && (
                        <p className="text-sm text-gray-600 mt-1">{section.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openSectionDialog(section);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSection(section.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {sections.length === 0 && (
                <p className="text-center text-gray-500 py-4">섹션이 없습니다.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 링크 목록 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              링크 관리
              <Button 
                size="sm" 
                onClick={() => openLinkDialog()}
                disabled={!selectedSection}
              >
                <Plus className="h-4 w-4 mr-1" />
                추가
              </Button>
            </CardTitle>
            <CardDescription>
              {selectedSection ? `${selectedSection.title} 섹션의 링크` : '섹션을 선택하세요'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedSection ? (
              <div className="space-y-2">
                {links.map((link) => (
                  <div key={link.id} className="p-3 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{link.title}</h4>
                          <Badge variant={link.is_active ? 'default' : 'secondary'}>
                            {link.is_active ? '활성' : '비활성'}
                          </Badge>
                          {link.target === '_blank' && (
                            <ExternalLink className="h-3 w-3 text-gray-400" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{link.url}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openLinkDialog(link)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteLink(link.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                {links.length === 0 && (
                  <p className="text-center text-gray-500 py-4">링크가 없습니다.</p>
                )}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">섹션을 선택하여 링크를 관리하세요.</p>
            )}
          </CardContent>
        </Card>

        {/* 미리보기 */}
        <Card>
          <CardHeader>
            <CardTitle>미리보기</CardTitle>
            <CardDescription>현재 풋터 설정의 미리보기입니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                {sections.filter(s => s.is_active).map((section) => (
                  <div key={section.id}>
                    <h4 className="font-medium mb-2">{section.title}</h4>
                    <ul className="space-y-1">
                      {links
                        .filter(l => l.section_id === section.id && l.is_active)
                        .map((link) => (
                          <li key={link.id}>
                            <a 
                              href={link.url} 
                              target={link.target}
                              className="text-blue-600 hover:underline"
                            >
                              {link.title}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
              <Separator className="my-4" />
              <p className="text-xs text-gray-600 text-center">
                {settingsForm.footer_copyright}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 섹션 편집 다이얼로그 */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSection ? '섹션 편집' : '새 섹션 추가'}
            </DialogTitle>
            <DialogDescription>
              풋터 섹션의 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="section-title">제목</Label>
              <Input
                id="section-title"
                value={sectionForm.title}
                onChange={(e) => setSectionForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="섹션 제목"
              />
            </div>
            <div>
              <Label htmlFor="section-description">설명</Label>
              <Textarea
                id="section-description"
                value={sectionForm.description}
                onChange={(e) => setSectionForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="섹션 설명 (선택사항)"
              />
            </div>
            <div>
              <Label htmlFor="section-order">순서</Label>
              <Input
                id="section-order"
                type="number"
                value={sectionForm.order_index}
                onChange={(e) => setSectionForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="section-active"
                checked={sectionForm.is_active}
                onChange={(e) => setSectionForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="section-active">활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={editingSection ? handleUpdateSection : handleCreateSection}>
              {editingSection ? '업데이트' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 링크 편집 다이얼로그 */}
      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingLink ? '링크 편집' : '새 링크 추가'}
            </DialogTitle>
            <DialogDescription>
              링크의 정보를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="link-title">제목</Label>
              <Input
                id="link-title"
                value={linkForm.title}
                onChange={(e) => setLinkForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="링크 제목"
              />
            </div>
            <div>
              <Label htmlFor="link-url">URL</Label>
              <Input
                id="link-url"
                value={linkForm.url}
                onChange={(e) => setLinkForm(prev => ({ ...prev, url: e.target.value }))}
                placeholder="https://example.com"
              />
            </div>
            <div>
              <Label htmlFor="link-target">타겟</Label>
              <Select
                value={linkForm.target}
                onValueChange={(value: '_self' | '_blank') => setLinkForm(prev => ({ ...prev, target: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_self">같은 창</SelectItem>
                  <SelectItem value="_blank">새 창</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="link-order">순서</Label>
              <Input
                id="link-order"
                type="number"
                value={linkForm.order_index}
                onChange={(e) => setLinkForm(prev => ({ ...prev, order_index: parseInt(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="link-active"
                checked={linkForm.is_active}
                onChange={(e) => setLinkForm(prev => ({ ...prev, is_active: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="link-active">활성화</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={editingLink ? handleUpdateLink : handleCreateLink}>
              {editingLink ? '업데이트' : '생성'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
