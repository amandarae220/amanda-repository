import { Component, Input } from '@angular/core';

/**
 * Tiny inline trend line.
 * Pass an array of numbers; renders a 0..1 normalized polyline at the given size.
 * No tooltips, no axes — it's a glance-value chart for KPI tiles.
 */
@Component({
  selector: 'app-sparkline',
  standalone: true,
  template: `
    <svg
      [attr.viewBox]="'0 0 ' + width + ' ' + height"
      [attr.width]="width"
      [attr.height]="height"
      [attr.aria-label]="ariaLabel"
      role="img"
      preserveAspectRatio="none">
      @if (points) {
        <polyline
          [attr.points]="points"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          opacity="0.85" />
        <polygon
          [attr.points]="fillPoints"
          fill="currentColor"
          opacity="0.12" />
      }
    </svg>
  `,
  styles: [':host { display: inline-block; line-height: 0; }'],
})
export class SparklineComponent {
  @Input({ required: true }) data: number[] = [];
  @Input() width = 80;
  @Input() height = 22;
  @Input() ariaLabel = 'Trend';

  get points(): string | null {
    if (!this.data.length) return null;
    const max = Math.max(...this.data, 1);
    const min = Math.min(...this.data, 0);
    const range = max - min || 1;
    const step = this.data.length > 1 ? this.width / (this.data.length - 1) : 0;
    return this.data
      .map((v, i) => {
        const x = i * step;
        const y = this.height - ((v - min) / range) * this.height;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }

  get fillPoints(): string | null {
    if (!this.points) return null;
    return `0,${this.height} ${this.points} ${this.width},${this.height}`;
  }
}
