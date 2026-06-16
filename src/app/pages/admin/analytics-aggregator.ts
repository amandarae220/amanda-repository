import { PortfolioEvent } from '../../services/analytics.service';

export type CountedItem = { label: string; count: number };
export type Timeframe = 'all' | '24h' | '7d' | '30d';
export type Filters = { timeframe: Timeframe; device: string; browser: string };

const HOURS_PER_DAY = 24;
const DAYS_PER_WEEK = 7;
const DAYS_PER_MONTH = 30;
const MS_PER_HOUR = 60 * 60 * 1000;
const DAILY_ACTIVITY_WINDOW_DAYS = 30;
const MAX_TOP_LINKS = 8;

export function applyFilters(events: PortfolioEvent[], filters: Filters): PortfolioEvent[] {
  let result = events;
  if (filters.timeframe !== 'all') {
    const hours = filters.timeframe === '24h'
      ? HOURS_PER_DAY
      : filters.timeframe === '7d'
        ? HOURS_PER_DAY * DAYS_PER_WEEK
        : HOURS_PER_DAY * DAYS_PER_MONTH;
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
  const total = exits.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
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
