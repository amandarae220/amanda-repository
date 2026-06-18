import { Component, Input } from '@angular/core';

/**
 * Small site-wide footer with copyright + privacy link.
 * Supports a dark variant for use inside the admin dashboard.
 */
@Component({
  selector: 'app-site-footer',
  standalone: true,
  template: `
    <footer class="site-footer" [class.dark]="dark">
      <p>© {{ year }} Amanda Lloyd · <a href="/privacy">Privacy</a></p>
    </footer>
  `,
  styles: [`
    .site-footer {
      padding: 1.25rem 2rem;
      text-align: center;
      border-top: 1px solid #eee;
      font-family: 'Inter', sans-serif;
      font-size: 0.8rem;
      color: #888;
      letter-spacing: 0.02em;
    }
    .site-footer p { margin: 0; }
    .site-footer a {
      color: #666;
      text-decoration: none;
      border-bottom: 1px solid transparent;
      transition: color 0.15s, border-color 0.15s;
    }
    .site-footer a:hover {
      color: var(--brand-purple);
      border-color: var(--brand-purple);
    }

    /* Dark variant for the admin dashboard */
    .site-footer.dark {
      border-top: 1px solid var(--border, #222);
      color: var(--muted, #666);
    }
    .site-footer.dark a {
      color: #aaa;
    }
    .site-footer.dark a:hover {
      color: var(--cyan, #00e5ff);
      border-color: var(--cyan, #00e5ff);
    }
  `],
})
export class SiteFooterComponent {
  @Input() dark = false;
  readonly year = new Date().getFullYear();
}
