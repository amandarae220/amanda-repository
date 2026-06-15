import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { AnalyticsService, PortfolioEvent } from '../../services/analytics.service';
import { environment } from '../../../environments/environment';

type Filters = { timeframe: 'all' | '24h' | '7d' | '30d'; device: string; browser: string };

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private analytics = inject(AnalyticsService);
  private metaSvc   = inject(Meta);

  // ── auth ──────────────────────────────────────────────────────────────────
  authenticated = false;
  passwordInput = '';
  authError = false;

  // ── data ──────────────────────────────────────────────────────────────────
  allEvents: PortfolioEvent[] = [];
  loading = false;
  loadError: string | null = null;
  lastUpdated: Date | null = null;

  // ── filters ───────────────────────────────────────────────────────────────
  filters: Filters = { timeframe: 'all', device: 'all', browser: 'all' };
  get filtered(): PortfolioEvent[] { return this.applyFilters(this.allEvents); }
  get filtersActive(): boolean { return this.filters.timeframe !== 'all' || this.filters.device !== 'all' || this.filters.browser !== 'all'; }

  // ── derived metrics ───────────────────────────────────────────────────────
  get uniqueVisitors(): number { return new Set(this.filtered.map(e => e.visitor_id)).size; }
  get totalPageViews(): number { return this.filtered.filter(e => e.event_type === 'page_view').length; }
  get totalLinkClicks(): number { return this.filtered.filter(e => e.event_type === 'link_click').length; }

  get avgTimeOnPage(): string {
    const exits = this.filtered.filter(e => e.event_type === 'page_exit' && e.duration_seconds);
    if (!exits.length) return '—';
    const avg = exits.reduce((s, e) => s + (e.duration_seconds ?? 0), 0) / exits.length;
    return this.fmtDuration(Math.round(avg));
  }

  get projectViews(): { label: string; count: number }[] {
    const views = this.filtered.filter(e => e.event_type === 'page_view' && e.page?.startsWith('/project/'));
    const counts: Record<string, number> = {};
    for (const e of views) {
      const id = e.page!.replace('/project/', '');
      counts[id] = (counts[id] ?? 0) + 1;
    }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  get topLinkClicks(): { label: string; count: number }[] {
    const clicks = this.filtered.filter(e => e.event_type === 'link_click' && e.label);
    const counts: Record<string, number> = {};
    for (const e of clicks) { counts[e.label!] = (counts[e.label!] ?? 0) + 1; }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }

  get trafficSources(): { label: string; count: number }[] {
    const sources = this.filtered.filter(e => e.event_type === 'page_view' && e.referrer);
    const counts: Record<string, number> = {};
    for (const e of sources) { counts[e.referrer!] = (counts[e.referrer!] ?? 0) + 1; }
    return Object.entries(counts)
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }

  get deviceBreakdown(): { label: string; count: number }[] {
    return this.breakdown('device');
  }

  get browserBreakdown(): { label: string; count: number }[] {
    return this.breakdown('browser');
  }

  get dailyActivity(): { date: string; count: number }[] {
    const days: Record<string, number> = {};
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 29);
    for (const e of this.filtered) {
      if (e.event_type !== 'page_view' || !e.created_at) continue;
      const d = new Date(e.created_at);
      if (d < cutoff) continue;
      const key = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
      days[key] = (days[key] ?? 0) + 1;
    }
    return Object.entries(days).map(([date, count]) => ({ date, count }));
  }

  get recentEvents(): PortfolioEvent[] { return this.filtered.slice(0, 50); }
  get maxDailyCount(): number { return Math.max(...this.dailyActivity.map(d => d.count), 1); }

  get uniqueDevices(): string[] { return [...new Set(this.allEvents.map(e => e.device).filter(Boolean))] as string[]; }
  get uniqueBrowsers(): string[] { return [...new Set(this.allEvents.map(e => e.browser).filter(Boolean))] as string[]; }

  ngOnInit(): void {
    this.metaSvc.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  submitPassword(): void {
    if (this.passwordInput === environment.adminPassword) {
      this.authenticated = true;
      this.authError = false;
      this.load();
    } else {
      this.authError = true;
    }
  }

  async load(): Promise<void> {
    this.loading = true;
    this.loadError = null;
    const { events, error } = await this.analytics.fetchEvents();
    this.allEvents = events;
    this.loadError = error;
    this.loading = false;
    this.lastUpdated = new Date();
  }

  clearFilters(): void { this.filters = { timeframe: 'all', device: 'all', browser: 'all' }; }

  barWidth(count: number, max: number): string { return max ? `${Math.round((count / max) * 100)}%` : '0%'; }

  fmtDuration(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const r = s % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  }

  fmtDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' });
  }

  fmtTime(iso: string): string {
    return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }

  private applyFilters(events: PortfolioEvent[]): PortfolioEvent[] {
    let result = [...events];
    if (this.filters.timeframe !== 'all') {
      const hours = this.filters.timeframe === '24h' ? 24 : this.filters.timeframe === '7d' ? 168 : 720;
      const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
      result = result.filter(e => e.created_at && new Date(e.created_at) >= cutoff);
    }
    if (this.filters.device !== 'all') result = result.filter(e => e.device === this.filters.device);
    if (this.filters.browser !== 'all') result = result.filter(e => e.browser === this.filters.browser);
    return result;
  }

  private breakdown(field: keyof PortfolioEvent): { label: string; count: number }[] {
    const counts: Record<string, number> = {};
    for (const e of this.filtered) {
      const val = e[field] as string;
      if (val) counts[val] = (counts[val] ?? 0) + 1;
    }
    return Object.entries(counts).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  }
}
