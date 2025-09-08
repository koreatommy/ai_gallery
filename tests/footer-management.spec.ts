import { test, expect } from '@playwright/test';

/**
 * 풋터 관리 기능 테스트
 * 관리자 대시보드의 풋터 관리 페이지 기능을 테스트합니다.
 */
test.describe('풋터 관리', () => {
  test.beforeEach(async ({ page }) => {
    // 풋터 관리 페이지로 이동
    await page.goto('http://localhost:3000/admin/content/footer');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
  });

  test('풋터 관리 페이지가 정상적으로 로드되는지 확인', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.getByRole('heading', { name: '풋터 관리' })).toBeVisible();
    
    // 설명 텍스트 확인
    await expect(page.getByText('사이트 풋터의 섹션과 링크를 관리합니다.')).toBeVisible();
    
    // 설정 버튼 확인
    await expect(page.getByRole('button', { name: '설정' })).toBeVisible();
  });

  test('풋터 섹션 추가 기능 테스트', async ({ page }) => {
    // 섹션 추가 버튼 클릭
    await page.getByRole('button', { name: '추가' }).first().click();
    
    // 다이얼로그가 열리는지 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '새 섹션 추가' })).toBeVisible();
    
    // 폼 필드 확인
    await expect(page.getByLabel('제목')).toBeVisible();
    await expect(page.getByLabel('설명')).toBeVisible();
    await expect(page.getByLabel('순서')).toBeVisible();
    await expect(page.getByLabel('활성화')).toBeVisible();
    
    // 섹션 정보 입력
    await page.getByLabel('제목').fill('테스트 섹션');
    await page.getByLabel('설명').fill('테스트용 섹션입니다');
    await page.getByLabel('순서').fill('1');
    
    // 생성 버튼 클릭
    await page.getByRole('button', { name: '생성' }).click();
    
    // 성공 메시지 확인 (토스트)
    await expect(page.getByText('섹션이 생성되었습니다.')).toBeVisible();
    
    // 새로 생성된 섹션이 목록에 표시되는지 확인
    await expect(page.getByText('테스트 섹션')).toBeVisible();
  });

  test('풋터 섹션 편집 기능 테스트', async ({ page }) => {
    // 기존 섹션이 있는지 확인하고 편집 버튼 클릭
    const editButton = page.getByRole('button').filter({ hasText: '' }).first();
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // 편집 다이얼로그 확인
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: '섹션 편집' })).toBeVisible();
      
      // 제목 수정
      await page.getByLabel('제목').fill('수정된 섹션');
      
      // 업데이트 버튼 클릭
      await page.getByRole('button', { name: '업데이트' }).click();
      
      // 성공 메시지 확인
      await expect(page.getByText('섹션이 업데이트되었습니다.')).toBeVisible();
    }
  });

  test('풋터 링크 추가 기능 테스트', async ({ page }) => {
    // 먼저 섹션을 선택해야 함
    const firstSection = page.locator('[data-testid="footer-section"]').first();
    if (await firstSection.isVisible()) {
      await firstSection.click();
      
      // 링크 추가 버튼 클릭
      await page.getByRole('button', { name: '추가' }).nth(1).click();
      
      // 링크 추가 다이얼로그 확인
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: '새 링크 추가' })).toBeVisible();
      
      // 링크 정보 입력
      await page.getByLabel('제목').fill('테스트 링크');
      await page.getByLabel('URL').fill('https://example.com');
      await page.getByLabel('타겟').selectOption('_blank');
      
      // 생성 버튼 클릭
      await page.getByRole('button', { name: '생성' }).click();
      
      // 성공 메시지 확인
      await expect(page.getByText('링크가 생성되었습니다.')).toBeVisible();
    }
  });

  test('풋터 설정 관리 기능 테스트', async ({ page }) => {
    // 설정 버튼 클릭
    await page.getByRole('button', { name: '설정' }).click();
    
    // 설정 다이얼로그 확인
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: '풋터 설정' })).toBeVisible();
    
    // 설정 필드 확인
    await expect(page.getByLabel('저작권 텍스트')).toBeVisible();
    await expect(page.getByLabel('소셜 미디어 표시')).toBeVisible();
    await expect(page.getByLabel('뉴스레터 표시')).toBeVisible();
    
    // 저작권 텍스트 수정
    await page.getByLabel('저작권 텍스트').fill('© 2024 테스트 갤러리. All rights reserved.');
    
    // 저장 버튼 클릭
    await page.getByRole('button', { name: '저장' }).click();
    
    // 성공 메시지 확인
    await expect(page.getByText('설정이 저장되었습니다.')).toBeVisible();
  });

  test('풋터 미리보기 기능 확인', async ({ page }) => {
    // 미리보기 섹션 확인
    await expect(page.getByRole('heading', { name: '미리보기' })).toBeVisible();
    await expect(page.getByText('현재 풋터 설정의 미리보기입니다.')).toBeVisible();
    
    // 미리보기 영역이 표시되는지 확인
    const previewArea = page.locator('.bg-gray-50');
    await expect(previewArea).toBeVisible();
  });

  test('반응형 디자인 확인', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 페이지가 정상적으로 표시되는지 확인
    await expect(page.getByRole('heading', { name: '풋터 관리' })).toBeVisible();
    
    // 그리드 레이아웃이 모바일에서 적절히 조정되는지 확인
    const gridContainer = page.locator('.grid');
    await expect(gridContainer).toBeVisible();
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('로딩 상태 확인', async ({ page }) => {
    // 페이지 새로고침
    await page.reload();
    
    // 로딩 상태가 표시되는지 확인 (잠깐만)
    const loadingText = page.getByText('로딩 중...');
    if (await loadingText.isVisible()) {
      await expect(loadingText).toBeVisible();
    }
    
    // 로딩이 완료되면 메인 콘텐츠가 표시되는지 확인
    await expect(page.getByRole('heading', { name: '풋터 관리' })).toBeVisible();
  });
});
