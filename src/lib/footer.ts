import { supabase } from './supabase';
import { FooterSection, FooterLink, SiteSetting, FooterSectionWithLinks } from '@/types';

/**
 * 풋터 섹션 관련 데이터베이스 함수들
 */
export class FooterService {
  /**
   * 모든 활성화된 풋터 섹션과 링크를 가져옵니다
   */
  static async getFooterSectionsWithLinks(): Promise<FooterSectionWithLinks[]> {
    const { data: sections, error: sectionsError } = await supabase
      .from('footer_sections')
      .select('*')
      .eq('is_active', true)
      .order('order_index', { ascending: true });

    if (sectionsError) {
      throw new Error(`풋터 섹션 조회 실패: ${sectionsError.message}`);
    }

    const sectionsWithLinks: FooterSectionWithLinks[] = [];

    for (const section of sections || []) {
      const { data: links, error: linksError } = await supabase
        .from('footer_links')
        .select('*')
        .eq('section_id', section.id)
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (linksError) {
        throw new Error(`풋터 링크 조회 실패: ${linksError.message}`);
      }

      sectionsWithLinks.push({
        ...section,
        links: links || []
      });
    }

    return sectionsWithLinks;
  }

  /**
   * 모든 풋터 섹션을 가져옵니다 (관리자용)
   */
  static async getAllFooterSections(): Promise<FooterSection[]> {
    const { data, error } = await supabase
      .from('footer_sections')
      .select('*')
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`풋터 섹션 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 특정 섹션의 모든 링크를 가져옵니다
   */
  static async getFooterLinksBySection(sectionId: string): Promise<FooterLink[]> {
    const { data, error } = await supabase
      .from('footer_links')
      .select('*')
      .eq('section_id', sectionId)
      .order('order_index', { ascending: true });

    if (error) {
      throw new Error(`풋터 링크 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 풋터 섹션을 생성합니다
   */
  static async createFooterSection(section: Omit<FooterSection, 'id' | 'created_at' | 'updated_at'>): Promise<FooterSection> {
    const { data, error } = await supabase
      .from('footer_sections')
      .insert([section])
      .select()
      .single();

    if (error) {
      throw new Error(`풋터 섹션 생성 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 풋터 섹션을 업데이트합니다
   */
  static async updateFooterSection(id: string, updates: Partial<FooterSection>): Promise<FooterSection> {
    const { data, error } = await supabase
      .from('footer_sections')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`풋터 섹션 업데이트 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 풋터 섹션을 삭제합니다
   */
  static async deleteFooterSection(id: string): Promise<void> {
    const { error } = await supabase
      .from('footer_sections')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`풋터 섹션 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 풋터 링크를 생성합니다
   */
  static async createFooterLink(link: Omit<FooterLink, 'id' | 'created_at' | 'updated_at'>): Promise<FooterLink> {
    const { data, error } = await supabase
      .from('footer_links')
      .insert([link])
      .select()
      .single();

    if (error) {
      throw new Error(`풋터 링크 생성 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 풋터 링크를 업데이트합니다
   */
  static async updateFooterLink(id: string, updates: Partial<FooterLink>): Promise<FooterLink> {
    const { data, error } = await supabase
      .from('footer_links')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`풋터 링크 업데이트 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 풋터 링크를 삭제합니다
   */
  static async deleteFooterLink(id: string): Promise<void> {
    const { error } = await supabase
      .from('footer_links')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`풋터 링크 삭제 실패: ${error.message}`);
    }
  }

  /**
   * 사이트 설정을 가져옵니다
   */
  static async getSiteSettings(): Promise<SiteSetting[]> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .order('key', { ascending: true });

    if (error) {
      throw new Error(`사이트 설정 조회 실패: ${error.message}`);
    }

    return data || [];
  }

  /**
   * 특정 사이트 설정을 가져옵니다
   */
  static async getSiteSetting(key: string): Promise<SiteSetting | null> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .eq('key', key)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116은 데이터가 없을 때
      throw new Error(`사이트 설정 조회 실패: ${error.message}`);
    }

    return data;
  }

  /**
   * 사이트 설정을 업데이트하거나 생성합니다
   */
  static async upsertSiteSetting(key: string, value: string, description?: string): Promise<SiteSetting> {
    // 먼저 기존 설정이 있는지 확인
    const existingSetting = await this.getSiteSetting(key);
    
    if (existingSetting) {
      // 기존 설정이 있으면 업데이트
      const { data, error } = await supabase
        .from('site_settings')
        .update({
          value,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('key', key)
        .select()
        .single();

      if (error) {
        throw new Error(`사이트 설정 업데이트 실패: ${error.message}`);
      }

      return data;
    } else {
      // 기존 설정이 없으면 새로 생성
      const { data, error } = await supabase
        .from('site_settings')
        .insert({
          key,
          value,
          description,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(`사이트 설정 생성 실패: ${error.message}`);
      }

      return data;
    }
  }

  /**
   * 풋터 섹션 순서를 업데이트합니다
   */
  static async updateSectionOrder(sections: { id: string; order_index: number }[]): Promise<void> {
    const updates = sections.map(section => ({
      id: section.id,
      order_index: section.order_index,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('footer_sections')
      .upsert(updates);

    if (error) {
      throw new Error(`풋터 섹션 순서 업데이트 실패: ${error.message}`);
    }
  }

  /**
   * 풋터 링크 순서를 업데이트합니다
   */
  static async updateLinkOrder(links: { id: string; order_index: number }[]): Promise<void> {
    const updates = links.map(link => ({
      id: link.id,
      order_index: link.order_index,
      updated_at: new Date().toISOString()
    }));

    const { error } = await supabase
      .from('footer_links')
      .upsert(updates);

    if (error) {
      throw new Error(`풋터 링크 순서 업데이트 실패: ${error.message}`);
    }
  }
}
