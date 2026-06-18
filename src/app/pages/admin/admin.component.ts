import { Component, OnInit, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { AnalyticsService, PortfolioEvent } from '../../services/analytics.service';
import {
  Filters,
  applyFilters, uniqueVisitors, totalPageViews, totalLinkClicks,
  projectViews, topLinkClicks, trafficSources,
  breakdown, computeVisitMetrics,
  dailySeries, dailySeriesPoints, dailySeriesPrior, periodDeltaPercent,
  metricVisits, metricUniqueVisitors, metricPageViews, metricLinkClicks,
  metricAvgPagesPerVisit, metricBounceRatePercent, metricAvgTimeOnSiteSeconds,
  visitHeatmap, topPages,
} from './analytics-aggregator';
import { fmtDuration, fmtDate, fmtTime, barWidth } from './format.utils';
import { HOME_CARDS } from '../project-detail/project-data';
import { SparklineComponent } from './charts/sparkline.component';
import { AreaSeriesComponent } from './charts/area-series.component';
import { HeatmapComponent } from './charts/heatmap.component';
import { LeaderboardComponent } from './charts/leaderboard.component';
import { EmptyStateComponent } from './charts/empty-state.component';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';

const MAX_RECENT_EVENTS = 50;
const SPARK_WINDOW_DAYS = 30;
const PROJECT_LABELS: Record<string, string> = Object.fromEntries(
  HOME_CARDS.map(c => [c.id, c.title]),
);

function pathLabel(path: string): string {
  if (path === '/') return 'Home';
  if (path.startsWith('/project/')) {
    const id = path.slice('/project/'.length);
    return PROJECT_LABELS[id] ?? id;
  }
  return path;
}

// Dated milestones plotted on the hero time-series. Dates that fall outside
// the current window are silently dropped by AreaSeries — safe to leave them.
const HERO_ANNOTATIONS = [
  { date: '2026-06-14', label: 'Resume v3 live' },
  { date: '2026-06-01', label: 'Migrated to Vercel' },
];

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    SparklineComponent, AreaSeriesComponent, HeatmapComponent,
    LeaderboardComponent, EmptyStateComponent, SiteFooterComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss'],
})
export class AdminComponent implements OnInit {
  private analytics  = inject(AnalyticsService);
  private metaSvc    = inject(Meta);
  private platformId = inject(PLATFORM_ID);

  // ── auth (plain state — only mutated via methods, no template binding to update) ──
  authenticated = false;
  emailInput = '';
  passwordInput = '';
  authError: string | null = null;
  authLoading = false;

  // ── reactive state ────────────────────────────────────────────────────────
  readonly allEvents   = signal<PortfolioEvent[]>([]);
  readonly loading     = signal(false);
  readonly loadError   = signal<string | null>(null);
  readonly lastUpdated = signal<Date | null>(null);
  readonly filters     = signal<Filters>({ timeframe: 'all', device: 'all', browser: 'all' });

  // ── derived state (memoized; only recompute when deps change) ─────────────
  readonly filtered       = computed(() => applyFilters(this.allEvents(), this.filters()));
  readonly filtersActive  = computed(() => {
    const f = this.filters();
    return f.timeframe !== 'all' || f.device !== 'all' || f.browser !== 'all';
  });

  readonly visitMetrics    = computed(() => computeVisitMetrics(this.filtered()));
  readonly totalVisits     = computed(() => this.visitMetrics().totalVisits);
  readonly uniqueVisitors  = computed(() => uniqueVisitors(this.filtered()));
  readonly totalPageViews  = computed(() => totalPageViews(this.filtered()));
  readonly totalLinkClicks = computed(() => totalLinkClicks(this.filtered()));

  readonly avgPagesPerVisit = computed(() => {
    const avg = this.visitMetrics().avgPagesPerVisit;
    return avg ? avg.toFixed(1) : '—';
  });
  readonly avgTimeOnSite = computed(() => {
    const s = this.visitMetrics().avgTimeOnSiteSeconds;
    return s === null ? '—' : fmtDuration(s);
  });
  readonly bounceRate = computed(() => {
    const m = this.visitMetrics();
    return m.totalVisits ? `${Math.round(m.bounceRate * 100)}%` : '—';
  });

  // Breakdown charts
  readonly projectViews = computed(() =>
    projectViews(this.filtered()).map(item => ({
      label: PROJECT_LABELS[item.label] ?? item.label,
      count: item.count,
    })),
  );
  readonly topLinkClicks    = computed(() => topLinkClicks(this.filtered()));
  readonly trafficSources   = computed(() => trafficSources(this.filtered()));
  readonly deviceBreakdown  = computed(() => breakdown(this.filtered(), 'device'));
  readonly browserBreakdown = computed(() => breakdown(this.filtered(), 'browser'));
  readonly recentEvents     = computed(() => this.filtered().slice(0, MAX_RECENT_EVENTS));

  // Sparklines + Δ (sourced from unfiltered events so trend isn't filter-dependent)
  readonly sparkVisits         = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricVisits));
  readonly sparkUniqueVisitors = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricUniqueVisitors));
  readonly sparkPageViews      = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricPageViews));
  readonly sparkAvgPages       = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricAvgPagesPerVisit));
  readonly sparkLinkClicks     = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricLinkClicks));
  readonly sparkBounce         = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricBounceRatePercent));
  readonly sparkTimeOnSite     = computed(() => dailySeries(this.allEvents(), SPARK_WINDOW_DAYS, metricAvgTimeOnSiteSeconds));

  readonly deltaVisits         = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricVisits));
  readonly deltaUniqueVisitors = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricUniqueVisitors));
  readonly deltaPageViews      = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricPageViews));
  readonly deltaAvgPages       = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricAvgPagesPerVisit));
  readonly deltaLinkClicks     = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricLinkClicks));
  // Bounce + time: positive delta on bounce is bad; positive on time is good. Template flips colors as needed.
  readonly deltaBounce         = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricBounceRatePercent));
  readonly deltaTimeOnSite     = computed(() => periodDeltaPercent(this.allEvents(), SPARK_WINDOW_DAYS, metricAvgTimeOnSiteSeconds));

  // Date-tagged series for AreaSeries (hero strip + Views chart)
  readonly seriesVisits       = computed(() => dailySeriesPoints(this.allEvents(), SPARK_WINDOW_DAYS, metricVisits));
  readonly seriesVisitsPrior  = computed(() => dailySeriesPrior(this.allEvents(), SPARK_WINDOW_DAYS, metricVisits));
  readonly seriesPageViews    = computed(() => dailySeriesPoints(this.allEvents(), SPARK_WINDOW_DAYS, metricPageViews));
  readonly heroAnnotations    = HERO_ANNOTATIONS;
  readonly heatmap            = computed(() => visitHeatmap(this.filtered()));

  readonly topPagesLeaderboard = computed(() =>
    topPages(this.filtered()).map(p => ({
      id: p.path,
      label: pathLabel(p.path),
      views: p.views,
      avgTimeSeconds: p.avgTimeSeconds,
      ctr: p.ctr,
    })),
  );

  readonly uniqueDevices  = computed(() => [...new Set(this.allEvents().map(e => e.device).filter(Boolean))] as string[]);
  readonly uniqueBrowsers = computed(() => [...new Set(this.allEvents().map(e => e.browser).filter(Boolean))] as string[]);

  // ── formatting (template uses these) ──────────────────────────────────────
  readonly barWidth    = barWidth;
  readonly fmtDuration = fmtDuration;
  readonly fmtDate     = fmtDate;
  readonly fmtTime     = fmtTime;

  // ── handlers ──────────────────────────────────────────────────────────────
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
    this.allEvents.set([]);
    this.lastUpdated.set(null);
    this.emailInput = '';
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set(null);
    const { events, error } = await this.analytics.fetchEvents();
    this.allEvents.set(events);
    this.loadError.set(error);
    this.loading.set(false);
    this.lastUpdated.set(new Date());
  }

  setTimeframe(value: Filters['timeframe']): void { this.filters.update(f => ({ ...f, timeframe: value })); }
  setDevice(value: string):  void { this.filters.update(f => ({ ...f, device: value })); }
  setBrowser(value: string): void { this.filters.update(f => ({ ...f, browser: value })); }
  clearFilters(): void { this.filters.set({ timeframe: 'all', device: 'all', browser: 'all' }); }
}
