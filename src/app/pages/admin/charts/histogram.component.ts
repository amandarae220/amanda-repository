import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface HistogramBucket {
  label: string;
  count: number;
  highlight?: boolean;  // visually mark the bounce bucket, the mode, etc.
}

/**
 * Vertical-bar histogram for discrete buckets (pages-per-visit, durations,
 * session counts, etc.). Designed to read at a glance — bucket labels below,
 * counts above the bar when there's room.
 */
@Component({
  selector: 'app-histogram',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="histogram" role="img" [attr.aria-label]="ariaLabel">
      <div class="bars">
        @for (b of buckets; track b.label) {
          <div class="col" [class.highlight]="b.highlight">
            <span class="count">{{ b.count }}</span>
            <div class="bar-wrap">
              <div class="bar" [style.height.%]="height(b.count)"></div>
            </div>
            <span class="label">{{ b.label }}</span>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .histogram { width: 100%; }
    .bars {
      display: flex;
      gap: 0.5rem;
      align-items: flex-end;
      height: 140px;
    }
    .col {
      flex: 1;
      min-width: 0;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-end;
      gap: 0.25rem;
      color: currentColor;
    }
    .count {
      font-size: 0.65rem;
      color: var(--muted, #666);
      font-variant-numeric: tabular-nums;
    }
    .bar-wrap {
      flex: 1;
      width: 100%;
      display: flex;
      align-items: flex-end;
      min-height: 0;
    }
    .bar {
      width: 100%;
      background: currentColor;
      opacity: 0.6;
      min-height: 2px;
      border-radius: 2px 2px 0 0;
      transition: height 0.4s ease;
    }
    .col.highlight .bar { opacity: 1; }
    .label {
      font-size: 0.65rem;
      letter-spacing: 0.04em;
      color: var(--muted, #666);
      white-space: nowrap;
    }
  `],
})
export class HistogramComponent {
  @Input({ required: true }) buckets: HistogramBucket[] = [];
  @Input() ariaLabel = 'Distribution';

  get max(): number { return Math.max(...this.buckets.map(b => b.count), 1); }

  height(count: number): number { return (count / this.max) * 100; }
}
