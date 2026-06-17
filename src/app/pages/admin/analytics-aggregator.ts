import { PortfolioEvent } from '../../services/analytics.service';

export type CountedItem = { label: string; count: number };
export type Timeframe = 'all' | '24h' | '7d' | '30d' | '90d';
export type Filters = { timeframe: Timeframe; device: string; browser: string };

const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const MS_PER_HOUR = 60 * 60 * 1000;
const DAILY_ACTIVITY_WINDOW_DAYS = 30;
const MAX_TOP_LINKS = 8;
const VISIT_TIMEOUT_MS = 30 * 60 * 1000;

// Cap per-page duration to filter out tab-idling. Anything beyond 30 min on a
// single page is the user walking away from the laptop, not engagement.
const MAX_PAGE_DURATION_SECONDS = 30 * 60;

// Referrers excluded from all metrics: dev-time noise that pollutes the dashboard.
const EXCLUDED_REFERRERS = new Set(['localhost', '127.0.0.1']);

export function applyFilters(events: PortfolioEvent[], filters: Filters): PortfolioEvent[] {
  let result = events.filter(e => !e.referrer || !EXCLUDED_REFERRERS.has(e.referrer));
  if (filters.timeframe !== 'all') {
    const hours = filters.timeframe === '24h' ? HOURS_PER_DAY
      : filters.timeframe === '7d'  ? HOURS_PER_DAY * DAYS_PER_WEEK
      : filters.timeframe === '30d' ? HOURS_PER_DAY * DAYS_PER_MONTH
      : HOURS_PER_DAY * 90; // 90d
    const cutoff = new Date(Date.now() - hours * MS_PER_HOUR);
    result = result.filter(e => e.created_at && new Date(e.created_at) >= cutoff);
  }
  if (filters.device !== 'all')  result = result.filter(e => e.device === filters.device);
  if (filters.browser !== 'all') result = result.filter(e => e.browser === filters.browser);
  return result;
}

export function uniqueVisitors(events: PortfolioEvent[]): number {
  return new Set(events.map(e => e.visitor_id)).size;
}

export function totalPageViews(events: PortfolioEvent[]): number {
  return events.filter(e => e.event_type === 'page_view').length;
}

export function totalLinkClicks(events: PortfolioEvent[]): number {
  return events.filter(e => e.event_type === 'link_click').length;
}

export function avgTimeOnPageSeconds(events: PortfolioEvent[]): number | null {
  const exits = events.filter(e => e.event_type === 'page_exit' && e.duration_seconds);
  if (!exits.length) return null;
  const total = exits.reduce((s, e) => s + Math.min(e.duration_seconds ?? 0, MAX_PAGE_DURATION_SECONDS), 0);
  return Math.round(total / exits.length);
}

export function projectViews(events: PortfolioEvent[]): CountedItem[] {
  const views = events.filter(e => e.event_type === 'page_view' && e.page?.startsWith('/project/'));
  const counts: Record<string, number> = {};
  for (const e of views) {
    const id = e.page!.replace('/project/', '');
    counts[id] = (counts[id] ?? 0) + 1;
  }
  return toSortedCountedItems(counts);
}

export function topLinkClicks(events: PortfolioEvent[]): CountedItem[] {
  const clicks = events.filter(e => e.event_type === 'link_click' && e.label);
  const counts: Record<string, number> = {};
  for (const e of clicks) counts[e.label!] = (counts[e.label!] ?? 0) + 1;
  return toSortedCountedItems(counts).slice(0, MAX_TOP_LINKS);
}

export function trafficSources(events: PortfolioEvent[]): CountedItem[] {
  const sources = events.filter(e => e.event_type === 'page_view' && e.referrer);
  const counts: Record<string, number> = {};
  for (const e of sources) counts[e.referrer!] = (counts[e.referrer!] ?? 0) + 1;
  return toSortedCountedItems(counts);
}

export function breakdown(events: PortfolioEvent[], field: keyof PortfolioEvent): CountedItem[] {
  const counts: Record<string, number> = {};
  for (const e of events) {
    const val = e[field] as string;
    if (val) counts[val] = (counts[val] ?? 0) + 1;
  }
  return toSortedCountedItems(counts);
}

export function dailyActivity(events: PortfolioEvent[]): { date: string; count: number }[] {
  const days: Record<string, number> = {};
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (DAILY_ACTIVITY_WINDOW_DAYS - 1));
  for (const e of events) {
    if (e.event_type !== 'page_view' || !e.created_at) continue;
    const d = new Date(e.created_at);
    if (d < cutoff) continue;
    const key = d.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
    days[key] = (days[key] ?? 0) + 1;
  }
  return Object.entries(days).map(([date, count]) => ({ date, count }));
}

function toSortedCountedItems(counts: Record<string, number>): CountedItem[] {
  return Object.entries(counts)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

// ── Visit-based metrics ────────────────────────────────────────────────────
// A "visit" is a sequence of events from one visitor with no gap > 30 min.

export interface VisitMetrics {
  totalVisits: number;
  avgPagesPerVisit: number;
  avgTimeOnSiteSeconds: number | null;
  bounceRate: number; // 0..1 — share of visits with only one page view
}

interface Visit {
  pageViews: number;
  durationSeconds: number;
}

export function computeVisitMetrics(events: PortfolioEvent[]): VisitMetrics {
  const visits = detectVisits(events);
  if (!visits.length) {
    return { totalVisits: 0, avgPagesPerVisit: 0, avgTimeOnSiteSeconds: null, bounceRate: 0 };
  }
  const totalPages = visits.reduce((s, v) => s + v.pageViews, 0);
  const totalDuration = visits.reduce((s, v) => s + v.durationSeconds, 0);
  const bounces = visits.filter(v => v.pageViews <= 1).length;
  return {
    totalVisits: visits.length,
    avgPagesPerVisit: totalPages / visits.length,
    avgTimeOnSiteSeconds: totalDuration ? Math.round(totalDuration / visits.length) : null,
    bounceRate: bounces / visits.length,
  };
}

// ── Period-over-period + sparkline series ─────────────────────────────────

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type Metric = (events: PortfolioEvent[]) => number;
export type DailyPoint = { date: string; value: number };

/**
 * Bucket events by day for the last `days` window (inclusive of today),
 * applying `metric` to each day's slice. Days with no events get 0.
 * Returns an array length === `days`, oldest-first.
 */
export function dailySeries(events: PortfolioEvent[], days: number, metric: Metric): number[] {
  const buckets: PortfolioEvent[][] = Array.from({ length: days }, () => []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startMs = today.getTime() - (days - 1) * MS_PER_DAY;
  for (const e of events) {
    if (!e.created_at) continue;
    const t = new Date(e.created_at).getTime();
    if (t < startMs) continue;
    const idx = Math.floor((t - startMs) / MS_PER_DAY);
    if (idx >= 0 && idx < days) buckets[idx].push(e);
  }
  return buckets.map(metric);
}

/**
 * Same as `dailySeries`, but for the prior `days` window (i.e. the period
 * ending `days` ago). Used to draw a comparison overlay aligned to the
 * current period's x-axis.
 */
export function dailySeriesPrior(events: PortfolioEvent[], days: number, metric: Metric): number[] {
  const buckets: PortfolioEvent[][] = Array.from({ length: days }, () => []);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentStart = today.getTime() - (days - 1) * MS_PER_DAY;
  const priorStart = currentStart - days * MS_PER_DAY;
  for (const e of events) {
    if (!e.created_at) continue;
    const t = new Date(e.created_at).getTime();
    if (t < priorStart || t >= currentStart) continue;
    const idx = Math.floor((t - priorStart) / MS_PER_DAY);
    if (idx >= 0 && idx < days) buckets[idx].push(e);
  }
  return buckets.map(metric);
}

/**
 * Same bucketing as `dailySeries`, but returns date-tagged points
 * for charts that need x-axis labels.
 */
export function dailySeriesPoints(events: PortfolioEvent[], days: number, metric: Metric): DailyPoint[] {
  const values = dailySeries(events, days, metric);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return values.map((value, i) => {
    const d = new Date(today.getTime() - (days - 1 - i) * MS_PER_DAY);
    return { date: d.toISOString().slice(0, 10), value };
  });
}

/**
 * Percent change between current `days` window and the prior `days` window.
 * Returns null when prior period has no data (delta meaningless).
 * Positive = up; negative = down; 0 = flat.
 */
export function periodDeltaPercent(events: PortfolioEvent[], days: number, metric: Metric): number | null {
  const now = Date.now();
  const currentCutoff = now - days * MS_PER_DAY;
  const priorCutoff = now - 2 * days * MS_PER_DAY;
  const current: PortfolioEvent[] = [];
  const prior: PortfolioEvent[] = [];
  for (const e of events) {
    if (!e.created_at) continue;
    const t = new Date(e.created_at).getTime();
    if (t >= currentCutoff) current.push(e);
    else if (t >= priorCutoff) prior.push(e);
  }
  const currentValue = metric(current);
  const priorValue = metric(prior);
  if (!priorValue) return null;
  return Math.round(((currentValue - priorValue) / priorValue) * 100);
}

/**
 * Distribution of pages-per-visit. Bucket 1 is the bounce bucket;
 * everything from 5+ collapses into a tail to keep the x-axis readable.
 */
export interface DepthBucket { label: string; count: number; isBounce: boolean }

export function visitDepthDistribution(events: PortfolioEvent[]): DepthBucket[] {
  const visits = detectVisits(events);
  const buckets = [0, 0, 0, 0, 0]; // 1, 2, 3, 4, 5+
  for (const v of visits) {
    const pages = Math.max(1, v.pageViews);
    const idx = pages >= 5 ? 4 : pages - 1;
    buckets[idx]++;
  }
  return [
    { label: '1',  count: buckets[0], isBounce: true },
    { label: '2',  count: buckets[1], isBounce: false },
    { label: '3',  count: buckets[2], isBounce: false },
    { label: '4',  count: buckets[3], isBounce: false },
    { label: '5+', count: buckets[4], isBounce: false },
  ];
}

/**
 * Per-page engagement across home + project pages.
 * `views` = page_view count for that path
 * `avgTimeSeconds` = avg duration_seconds from page_exit events on that page (capped)
 * `ctr` = outbound clicks / views (0..1)
 *   — home page: project_click counts as the outbound action
 *   — project pages: link_click counts as outbound
 * Sorted by views desc.
 */
export interface PagePerformance {
  path: string;
  views: number;
  avgTimeSeconds: number | null;
  ctr: number;
  outboundClicks: number;
}

export function topPages(events: PortfolioEvent[]): PagePerformance[] {
  const byPath: Record<string, { views: number; durations: number[]; outboundClicks: number }> = {};
  for (const e of events) {
    const path = e.page;
    if (!path) continue;
    if (path !== '/' && !path.startsWith('/project/')) continue; // home + projects only
    const bucket = (byPath[path] ??= { views: 0, durations: [], outboundClicks: 0 });
    if (e.event_type === 'page_view') bucket.views++;
    if (e.event_type === 'page_exit' && e.duration_seconds) {
      bucket.durations.push(Math.min(e.duration_seconds, MAX_PAGE_DURATION_SECONDS));
    }
    // outbound = project_click on home, link_click elsewhere
    const isOutbound = path === '/'
      ? e.event_type === 'project_click'
      : e.event_type === 'link_click';
    if (isOutbound) bucket.outboundClicks++;
  }
  return Object.entries(byPath)
    .map(([path, b]): PagePerformance => ({
      path,
      views: b.views,
      avgTimeSeconds: b.durations.length ? Math.round(b.durations.reduce((s, n) => s + n, 0) / b.durations.length) : null,
      ctr: b.views ? b.outboundClicks / b.views : 0,
      outboundClicks: b.outboundClicks,
    }))
    .sort((a, b) => b.views - a.views);
}

/**
 * 7×24 matrix counting page_view events by day-of-week × hour-of-day.
 * Rows: Mon..Sun (0..6). Cols: 0..23.
 * Counts unique sessions (visitor_id + page_view) so a single page reload
 * doesn't dominate.
 */
export function visitHeatmap(events: PortfolioEvent[]): number[][] {
  const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  for (const e of events) {
    if (e.event_type !== 'page_view' || !e.created_at) continue;
    const d = new Date(e.created_at);
    // JS getDay: 0=Sun..6=Sat. Shift so Mon=0..Sun=6.
    const dow = (d.getDay() + 6) % 7;
    const hour = d.getHours();
    matrix[dow][hour]++;
  }
  return matrix;
}

// Convenience metrics for the daily series + delta helpers
export const metricVisits: Metric = (events) => computeVisitMetrics(events).totalVisits;
export const metricUniqueVisitors: Metric = (events) => uniqueVisitors(events);
export const metricPageViews: Metric = (events) => totalPageViews(events);
export const metricLinkClicks: Metric = (events) => totalLinkClicks(events);
export const metricAvgPagesPerVisit: Metric = (events) => computeVisitMetrics(events).avgPagesPerVisit;
export const metricBounceRatePercent: Metric = (events) => {
  const m = computeVisitMetrics(events);
  return m.totalVisits ? m.bounceRate * 100 : 0;
};
export const metricAvgTimeOnSiteSeconds: Metric = (events) => computeVisitMetrics(events).avgTimeOnSiteSeconds ?? 0;

function detectVisits(events: PortfolioEvent[]): Visit[] {
  const byVisitor: Record<string, PortfolioEvent[]> = {};
  for (const e of events) {
    if (!e.created_at) continue;
    (byVisitor[e.visitor_id] ??= []).push(e);
  }
  const visits: Visit[] = [];
  for (const visitorEvents of Object.values(byVisitor)) {
    visitorEvents.sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());
    let current: Visit | null = null;
    let lastTime = 0;
    for (const e of visitorEvents) {
      const t = new Date(e.created_at!).getTime();
      if (!current || t - lastTime > VISIT_TIMEOUT_MS) {
        if (current) visits.push(current);
        current = { pageViews: 0, durationSeconds: 0 };
      }
      if (e.event_type === 'page_view') current.pageViews++;
      if (e.event_type === 'page_exit' && e.duration_seconds) {
        current.durationSeconds += Math.min(e.duration_seconds, MAX_PAGE_DURATION_SECONDS);
      }
      lastTime = t;
    }
    if (current) visits.push(current);
  }
  return visits;
}
