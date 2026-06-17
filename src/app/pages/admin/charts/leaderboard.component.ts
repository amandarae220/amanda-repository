import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LeaderboardRow {
  id: string;
  label: string;
  views: number;
  avgTimeSeconds: number | null;
  ctr: number; // 0..1
}

/**
 * Compact ranked table of projects with three engagement metrics shown
 * side-by-side as proportional mini bars. Sorted by views desc by default;
 * caller controls the sort.
 *
 * Each metric has its own bar scaled to the column max — that way the
 * shape of the row is the comparison, not the absolute number.
 */
@Component({
  selector: 'app-leaderboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="leaderboard" role="table" aria-label="Project performance leaderboard">
      <div class="lb-head" role="row">
        <span class="lb-rank" role="columnheader" aria-hidden="true">#</span>
        <span class="lb-name" role="columnheader">PROJECT</span>
        <span class="lb-metric" role="columnheader">VIEWS</span>
        <span class="lb-metric" role="columnheader">AVG TIME</span>
        <span class="lb-metric" role="columnheader">CTR</span>
      </div>
      @for (row of rows; track row.id; let i = $index) {
        <div class="lb-row" role="row">
          <span class="lb-rank" aria-hidden="true">{{ i + 1 }}</span>
          <span class="lb-name" role="cell">{{ row.label }}</span>
          <span class="lb-metric" role="cell">
            <span class="lb-bar"><span class="lb-fill" [style.width.%]="pct(row.views, maxViews)"></span></span>
            <span class="lb-num">{{ row.views }}</span>
          </span>
          <span class="lb-metric" role="cell">
            <span class="lb-bar"><span class="lb-fill" [style.width.%]="pct(row.avgTimeSeconds ?? 0, maxTime)"></span></span>
            <span class="lb-num">{{ row.avgTimeSeconds === null ? '—' : fmt(row.avgTimeSeconds) }}</span>
          </span>
          <span class="lb-metric" role="cell">
            <span class="lb-bar"><span class="lb-fill" [style.width.%]="pct(row.ctr, maxCtr)"></span></span>
            <span class="lb-num">{{ row.ctr ? (row.ctr * 100 | number:'1.0-0') + '%' : '—' }}</span>
          </span>
        </div>
      } @empty {
        <p class="no-data">No project traffic yet</p>
      }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .leaderboard {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }
    .lb-head, .lb-row {
      display: grid;
      grid-template-columns: 18px minmax(0, 1.4fr) repeat(3, minmax(0, 1fr));
      align-items: center;
      gap: 0.6rem;
      font-size: 0.78rem;
    }
    .lb-head {
      font-size: 0.6rem;
      letter-spacing: 0.14em;
      color: var(--muted, #666);
      padding-bottom: 0.25rem;
      border-bottom: 1px solid var(--border, #222);
    }
    .lb-rank {
      font-size: 0.65rem;
      color: var(--muted, #666);
      text-align: right;
      font-variant-numeric: tabular-nums;
    }
    .lb-name {
      color: #fff;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .lb-metric {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .lb-bar {
      flex: 1;
      height: 6px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 1px;
      overflow: hidden;
      min-width: 24px;
    }
    .lb-fill {
      display: block;
      height: 100%;
      background: currentColor;
      opacity: 0.75;
      transition: width 0.4s ease;
    }
    .lb-num {
      font-size: 0.72rem;
      color: #aaa;
      font-variant-numeric: tabular-nums;
      min-width: 36px;
      text-align: right;
      flex-shrink: 0;
    }
    .no-data {
      font-size: 0.8rem;
      color: var(--muted, #666);
      font-style: italic;
      text-align: center;
      padding: 1rem 0;
    }
  `],
})
export class LeaderboardComponent {
  @Input({ required: true }) rows: LeaderboardRow[] = [];

  get maxViews(): number { return Math.max(...this.rows.map(r => r.views), 1); }
  get maxTime(): number  { return Math.max(...this.rows.map(r => r.avgTimeSeconds ?? 0), 1); }
  get maxCtr(): number   { return Math.max(...this.rows.map(r => r.ctr), 0.01); }

  pct(value: number, max: number): number {
    return max > 0 ? Math.round((value / max) * 100) : 0;
  }

  fmt(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const r = seconds % 60;
    return r ? `${m}m ${r}s` : `${m}m`;
  }
}
