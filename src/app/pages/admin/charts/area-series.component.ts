import { Component, Input } from '@angular/core';

export type DailyPoint = { date: string; value: number };
export type Annotation = { date: string; label: string };

/**
 * Daily time-series rendered as a smooth area + line, optionally with a
 * 7-day rolling average overlay. Pure SVG; scales via viewBox.
 *
 * Layout: full-bleed area chart, x-axis labels every Nth day, optional
 * baseline tick marks. Designed to compose inside both a hero strip
 * (decorative) and a standalone card (analytical).
 */
@Component({
  selector: 'app-area-series',
  standalone: true,
  template: `
    <div class="chart-wrap" [style.height.px]="height">
      <svg
        [attr.viewBox]="'0 0 ' + width + ' ' + height"
        [attr.aria-label]="ariaLabel"
        role="img"
        preserveAspectRatio="none">
        <g [attr.opacity]="chartOpacity">
          @if (showGrid) {
            <line
              [attr.x1]="0" [attr.y1]="chartHeight" [attr.x2]="width" [attr.y2]="chartHeight"
              stroke="currentColor" stroke-opacity="0.15" stroke-dasharray="2 4" />
          }
          @if (areaPath) {
            <path [attr.d]="areaPath" fill="currentColor" opacity="0.15" />
            <path [attr.d]="linePath" fill="none" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" />
          }
          @if (showRollingAvg && rollingPath) {
            <path [attr.d]="rollingPath" fill="none" stroke="currentColor" stroke-width="1.2"
              stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="3 3" opacity="0.55" />
          }
          @if (comparePath) {
            <path [attr.d]="comparePath" fill="none" stroke="currentColor" stroke-width="1"
              stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 4" opacity="0.35" />
          }
        </g>
        @for (mark of annotationMarks; track mark.x) {
          <line [attr.x1]="mark.x" [attr.y1]="0" [attr.x2]="mark.x" [attr.y2]="chartHeight"
            stroke="currentColor" stroke-opacity="0.5" stroke-dasharray="2 3" />
        }
      </svg>
      <!-- Text rendered as HTML overlays so it doesn't get stretched by preserveAspectRatio="none". -->
      @for (mark of annotationMarks; track mark.x + '|' + mark.label) {
        <span
          class="annotation-label"
          [class.anchor-end]="mark.anchor === 'end'"
          [style.left.%]="(mark.x / width) * 100">{{ mark.label }}</span>
      }
      @if (showAxis) {
        @for (label of xLabels; track label.x) {
          <span class="axis-label" [style.left.%]="(label.x / width) * 100">{{ label.text }}</span>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; line-height: 0; width: 100%; }
    .chart-wrap { position: relative; width: 100%; }
    svg { display: block; width: 100%; height: 100%; }
    /* Strokes stay consistent regardless of how preserveAspectRatio="none" stretches the viewBox */
    path, line { vector-effect: non-scaling-stroke; }

    .annotation-label, .axis-label {
      position: absolute;
      font-family: inherit;
      pointer-events: none;
      white-space: nowrap;
    }
    .annotation-label {
      top: 12px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.05em;
      color: currentColor;
      opacity: 0.95;
      padding-left: 6px;
      text-shadow: 0 0 4px rgba(0, 0, 0, 0.9), 0 0 2px rgba(0, 0, 0, 1);
    }
    .annotation-label.anchor-end {
      transform: translateX(-100%);
      padding-left: 0;
      padding-right: 6px;
    }
    .axis-label {
      bottom: 0;
      font-size: 9px;
      letter-spacing: 0.04em;
      color: var(--muted, #666);
      transform: translateX(-50%);
    }
  `],
})
export class AreaSeriesComponent {
  @Input({ required: true }) data: DailyPoint[] = [];
  @Input() width = 600;
  @Input() height = 120;
  @Input() showRollingAvg = false;
  @Input() rollingAvgWindow = 7;
  @Input() showAxis = true;
  @Input() showGrid = true;
  @Input() ariaLabel = 'Time series';
  /** Optional prior-period overlay. Same length as `data`; rendered as a faint dotted line. */
  @Input() compareTo: number[] | null = null;
  /** Optional dated annotations (e.g. "Resume v3 launched"). Plotted as vertical guide lines. */
  @Input() annotations: Annotation[] = [];
  /** Opacity for the area+line+overlays only. Annotation labels stay at full opacity. */
  @Input() chartOpacity = 1;

  private get axisHeight(): number { return this.showAxis ? 14 : 0; }
  get chartHeight(): number { return this.height - this.axisHeight; }

  private xy(values: number[]): { x: number; y: number }[] {
    if (!values.length) return [];
    const max = Math.max(...values, 1);
    const min = 0; // anchor area to zero, not the lowest value
    const range = max - min || 1;
    const step = values.length > 1 ? this.width / (values.length - 1) : 0;
    return values.map((v, i) => ({
      x: i * step,
      y: this.chartHeight - ((v - min) / range) * this.chartHeight,
    }));
  }

  get areaPath(): string | null {
    if (!this.data.length) return null;
    const pts = this.xy(this.data.map(d => d.value));
    if (!pts.length) return null;
    const line = this.smoothPath(pts);
    return `${line} L ${this.width},${this.chartHeight} L 0,${this.chartHeight} Z`;
  }

  get linePath(): string | null {
    if (!this.data.length) return null;
    const pts = this.xy(this.data.map(d => d.value));
    return pts.length ? this.smoothPath(pts) : null;
  }

  get rollingPath(): string | null {
    if (!this.data.length) return null;
    const rolled = this.rollingAverage(this.data.map(d => d.value), this.rollingAvgWindow);
    const pts = this.xy(rolled);
    return pts.length ? this.smoothPath(pts) : null;
  }

  get comparePath(): string | null {
    if (!this.compareTo?.length || !this.data.length) return null;
    // Scale compareTo against the current series' max so they share an axis
    const currentMax = Math.max(...this.data.map(d => d.value), 1);
    const step = this.data.length > 1 ? this.width / (this.data.length - 1) : 0;
    const pts = this.compareTo.map((v, i) => ({
      x: i * step,
      y: this.chartHeight - (v / currentMax) * this.chartHeight,
    }));
    return pts.length ? this.smoothPath(pts) : null;
  }

  get annotationMarks(): { x: number; label: string; anchor: 'start' | 'end' }[] {
    if (!this.annotations.length || !this.data.length) return [];
    const step = this.data.length > 1 ? this.width / (this.data.length - 1) : 0;
    const dateToIndex = new Map(this.data.map((d, i) => [d.date, i]));
    // Flip label to the left of the line for marks in the right third of the chart
    // so the label never overflows the viewBox.
    const flipThreshold = this.width * 0.66;
    return this.annotations
      .map(a => {
        const idx = dateToIndex.get(a.date);
        if (idx === undefined) return null;
        const x = idx * step;
        return { x, label: a.label, anchor: x > flipThreshold ? 'end' as const : 'start' as const };
      })
      .filter((m): m is { x: number; label: string; anchor: 'start' | 'end' } => m !== null);
  }

  get xLabels(): { x: number; text: string }[] {
    if (!this.data.length || !this.showAxis) return [];
    const tickCount = Math.min(6, this.data.length);
    const stride = Math.max(1, Math.floor((this.data.length - 1) / (tickCount - 1)));
    const step = this.data.length > 1 ? this.width / (this.data.length - 1) : 0;
    const out: { x: number; text: string }[] = [];
    for (let i = 0; i < this.data.length; i += stride) {
      out.push({ x: i * step, text: this.shortDate(this.data[i].date) });
    }
    return out;
  }

  private shortDate(iso: string): string {
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }

  private rollingAverage(series: number[], window: number): number[] {
    const out: number[] = [];
    let sum = 0;
    const buf: number[] = [];
    for (const v of series) {
      buf.push(v);
      sum += v;
      if (buf.length > window) sum -= buf.shift()!;
      out.push(sum / buf.length);
    }
    return out;
  }

  /** Catmull-Rom-ish smoothing via quadratic Bézier midpoints. */
  private smoothPath(pts: { x: number; y: number }[]): string {
    if (pts.length < 2) return `M ${pts[0]?.x ?? 0},${pts[0]?.y ?? 0}`;
    let d = `M ${pts[0].x.toFixed(1)},${pts[0].y.toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      const p0 = pts[i - 1];
      const p1 = pts[i];
      const cx = (p0.x + p1.x) / 2;
      const cy = (p0.y + p1.y) / 2;
      d += ` Q ${p0.x.toFixed(1)},${p0.y.toFixed(1)} ${cx.toFixed(1)},${cy.toFixed(1)}`;
    }
    const last = pts[pts.length - 1];
    d += ` T ${last.x.toFixed(1)},${last.y.toFixed(1)}`;
    return d;
  }
}
