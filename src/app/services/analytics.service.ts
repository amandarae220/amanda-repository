import { Injectable, inject } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { VisitorService } from './visitor.service';

export type PortfolioEvent = {
  id?: string;
  visitor_id: string;
  event_type: 'page_view' | 'project_click' | 'link_click' | 'page_exit';
  page?: string;
  label?: string;
  referrer?: string;
  device?: string;
  browser?: string;
  duration_seconds?: number;
  created_at?: string;
};

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private visitor = inject(VisitorService);
  private client: SupabaseClient | null = null;

  constructor() {
    const { supabaseAnonKey } = environment;
    const supabaseUrl = environment.supabaseUrl.replace(/\/rest\/v1\/?$/, '');
    if (supabaseUrl && !supabaseUrl.startsWith('PLACEHOLDER') && supabaseAnonKey && !supabaseAnonKey.startsWith('PLACEHOLDER')) {
      this.client = createClient(supabaseUrl, supabaseAnonKey);
    }
  }

  private base(): Omit<PortfolioEvent, 'event_type'> {
    return {
      visitor_id: this.visitor.getVisitorId(),
      device: this.visitor.getDevice(),
      browser: this.visitor.getBrowser(),
      referrer: this.visitor.getReferrer(),
      page: this.visitor.isBrowser ? window.location.pathname : '',
    };
  }

  trackPageView(page: string): void {
    if (!this.visitor.isBrowser) return;
    this.insert({ ...this.base(), event_type: 'page_view', page });
  }

  trackProjectClick(projectId: string): void {
    if (!this.visitor.isBrowser) return;
    this.insert({ ...this.base(), event_type: 'project_click', label: projectId });
  }

  trackLinkClick(label: string, page: string): void {
    if (!this.visitor.isBrowser) return;
    this.insert({ ...this.base(), event_type: 'link_click', label, page });
  }

  trackPageExit(page: string, durationSeconds: number): void {
    if (!this.visitor.isBrowser) return;
    this.insert({ ...this.base(), event_type: 'page_exit', page, duration_seconds: durationSeconds });
  }

  async fetchEvents(): Promise<{ events: PortfolioEvent[]; error: string | null }> {
    if (!this.client) return { events: [], error: 'No database connection' };
    const { data, error } = await this.client
      .from('portfolio_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(2000);
    return {
      events: (data ?? []) as PortfolioEvent[],
      error: error?.message ?? null,
    };
  }

  private async insert(event: PortfolioEvent): Promise<void> {
    if (!this.client) return;
    await this.client.from('portfolio_events').insert(event);
  }
}
