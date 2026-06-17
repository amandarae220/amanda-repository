import { Component, Input } from '@angular/core';

/**
 * 7×24 visit-intensity heatmap (day-of-week × hour-of-day).
 * Rendered as CSS grid — no SVG needed at this density.
 *
 * Cells are colored by intensity (count / max) with alpha; zero cells
 * render as a faint outline so the empty calendar is still legible.
 */
@Component({
  selector: 'app-heatmap',
  standalone: true,
  template: `
    <div class="heatmap" [style.--accent]="accent">
      <!-- y-axis labels (days) -->
      <div class="day-col">
        <span class="day-label" aria-hidden="true"></span>
        @for (day of dayLabels; track day) {
          <span class="day-label">{{ day }}</span>
        }
      </div>
      <!-- grid + x-axis -->
      <div class="grid-wrap">
        <div class="hour-row" aria-hidden="true">
          @for (h of hourLabels; track h.idx) {
            <span class="hour-label" [style.grid-column]="h.idx + 1">{{ h.text }}</span>
          }
        </div>
        <div class="cells" role="img" [attr.aria-label]="ariaLabel">
          @for (cell of cells; track cell.key) {
            <div class="cell"
                 [style.opacity]="cell.intensity"
                 [attr.title]="cell.title"
                 [class.empty]="cell.count === 0"></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .heatmap {
      display: flex;
      gap: 0.5rem;
      font-family: inherit;
    }
    .day-col {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding-top: 18px; // align with hour-row height
    }
    .day-label {
      font-size: 0.6rem;
      letter-spacing: 0.1em;
      color: var(--muted, #666);
      height: 100%;
      flex: 1;
      display: flex;
      align-items: center;
    }
    .grid-wrap {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 0;
    }
    .hour-row {
      display: grid;
      grid-template-columns: repeat(24, 1fr);
      height: 14px;
    }
    .hour-label {
      font-size: 0.55rem;
      letter-spacing: 0.04em;
      color: var(--muted, #666);
      text-align: center;
    }
    .cells {
      display: grid;
      grid-template-columns: repeat(24, 1fr);
      grid-template-rows: repeat(7, 1fr);
      gap: 2px;
      flex: 1;
      min-height: 140px;
    }
    .cell {
      background: var(--accent);
      border-radius: 2px;
      min-height: 0;
    }
    .cell.empty {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.04);
    }
  `],
})
export class HeatmapComponent {
  /** 7×24 matrix; rows are Mon..Sun, cols are 0..23. */
  @Input({ required: true }) matrix: number[][] = [];
  @Input() accent = 'var(--pink, #ff5fa0)';
  @Input() ariaLabel = 'Visit intensity by hour of day and day of week';

  dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  hourLabels = [
    { idx: 0,  text: '12a' },
    { idx: 6,  text: '6a' },
    { idx: 12, text: '12p' },
    { idx: 18, text: '6p' },
    { idx: 23, text: '11p' },
  ];

  get cells(): { key: string; count: number; intensity: number; title: string }[] {
    if (!this.matrix.length) return [];
    const max = Math.max(...this.matrix.flat(), 1);
    const out: { key: string; count: number; intensity: number; title: string }[] = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const count = this.matrix[day]?.[hour] ?? 0;
        const intensity = count === 0 ? 0 : 0.15 + 0.85 * (count / max);
        out.push({
          key: `${day}-${hour}`,
          count,
          intensity,
          title: `${this.dayLabels[day]} ${hour}:00 — ${count} ${count === 1 ? 'visit' : 'visits'}`,
        });
      }
    }
    return out;
  }
}
