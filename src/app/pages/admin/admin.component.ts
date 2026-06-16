import { Component, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { AnalyticsService, PortfolioEvent } from '../../services/analytics.service';
import {
  CountedItem, Filters,
  applyFilters, uniqueVisitors, totalPageViews, totalLinkClicks,
  avgTimeOnPageSeconds, projectViews, topLinkClicks, trafficSources,
  breakdown, dailyActivity,
} from './analytics-aggregator';
import { fmtDuration, fmtDate, fmtTime, barWidth } from './format.utils';

const MAX_RECENT_EVENTS = 50;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private analytics  = inject(AnalyticsService);
  private metaSvc    = inject(Meta);
  private platformId = inject(PLATFORM_ID);

  // ── auth ──────────────────────────────────────────────────────────────────
  authenticated = false;
  emailInput = '';
  passwordInput = '';
  authError: string | null = null;
  authLoading = false;

  // ── data ──────────────────────────────────────────────────────────────────
  allEvents: PortfolioEvent[] = [];
  loading = false;
  loadError: string | null = null;
  lastUpdated: Date | null = null;

  // ── filters ───────────────────────────────────────────────────────────────
  filters: Filters = { timeframe: 'all', device: 'all', browser: 'all' };
  get filtered(): PortfolioEvent[] { return applyFilters(this.allEvents, this.filters); }
  get filtersActive(): boolean {
    return this.filters.timeframe !== 'all' || this.filters.device !== 'all' || this.filters.browser !== 'all';
  }

  // ── derived metrics (delegate to aggregator) ──────────────────────────────
  get uniqueVisitors(): number     { return uniqueVisitors(this.filtered); }
  get totalPageViews(): number     { return totalPageViews(this.filtered); }
  get totalLinkClicks(): number    { return totalLinkClicks(this.filtered); }
  get projectViews(): CountedItem[]   { return projectViews(this.filtered); }
  get topLinkClicks(): CountedItem[]  { return topLinkClicks(this.filtered); }
  get trafficSources(): CountedItem[] { return trafficSources(this.filtered); }
  get deviceBreakdown(): CountedItem[]  { return breakdown(this.filtered, 'device'); }
  get browserBreakdown(): CountedItem[] { return breakdown(this.filtered, 'browser'); }
  get dailyActivity(): { date: string; count: number }[] { return dailyActivity(this.filtered); }
  get recentEvents(): PortfolioEvent[] { return this.filtered.slice(0, MAX_RECENT_EVENTS); }
  get maxDailyCount(): number { return Math.max(...this.dailyActivity.map(d => d.count), 1); }

  get avgTimeOnPage(): string {
    const avg = avgTimeOnPageSeconds(this.filtered);
    return avg === null ? '—' : fmtDuration(avg);
  }

  get uniqueDevices(): string[]  { return [...new Set(this.allEvents.map(e => e.device).filter(Boolean))] as string[]; }
  get uniqueBrowsers(): string[] { return [...new Set(this.allEvents.map(e => e.browser).filter(Boolean))] as string[]; }

  // ── formatting (template uses these) ──────────────────────────────────────
  barWidth = barWidth;
  fmtDuration = fmtDuration;
  fmtDate = fmtDate;
  fmtTime = fmtTime;

  async ngOnInit(): Promise<void> {
    this.metaSvc.updateTag({ name: 'robots', content: 'noindex, nofollow' });
    if (!isPlatformBrowser(this.platformId)) return;
    const session = await this.analytics.getSession();
    if (session) {
      this.authenticated = true;
      this.load();
    }
  }

  async submitLogin(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    this.authLoading = true;
    this.authError = null;
    const { error } = await this.analytics.signIn(this.emailInput, this.passwordInput);
    this.authLoading = false;
    if (error) {
      this.authError = error;
      return;
    }
    this.authenticated = true;
    this.passwordInput = '';
    this.load();
  }

  async signOut(): Promise<void> {
    await this.analytics.signOut();
    this.authenticated = false;
    this.allEvents = [];
    this.emailInput = '';
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
}
