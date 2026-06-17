import { Component, Input } from '@angular/core';

/**
 * Friendly placeholder for charts with no data yet.
 * Uses currentColor so it inherits the card's accent.
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9c2.39 0 4.68.94 6.36 2.64"/>
        <polyline points="21 5 21 9 17 9"/>
      </svg>
      <p class="empty-msg">{{ message }}</p>
      @if (hint) { <p class="empty-hint">{{ hint }}</p> }
    </div>
  `,
  styles: [`
    :host { display: block; }
    .empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 1.5rem 0.5rem;
      color: var(--accent-color, var(--muted, #666));
      opacity: 0.8;
    }
    svg { width: 22px; height: 22px; opacity: 0.7; }
    .empty-msg {
      margin: 0;
      font-size: 0.8rem;
      letter-spacing: 0.04em;
      color: #aaa;
    }
    .empty-hint {
      margin: 0;
      font-size: 0.7rem;
      color: var(--muted, #666);
      font-style: italic;
      text-align: center;
    }
  `],
})
export class EmptyStateComponent {
  @Input({ required: true }) message = '';
  @Input() hint = '';
}
