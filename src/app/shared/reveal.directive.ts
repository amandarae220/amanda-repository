import {
  AfterViewInit,
  Directive,
  ElementRef,
  OnDestroy,
  PLATFORM_ID,
  inject,
  input,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * Reveals the host (or, with `revealStagger`, its direct children) with a
 * fade + rise once it scrolls into view.
 *
 * - `appReveal` alone: the host element reveals.
 * - `appReveal [revealStagger]="90"`: each direct child reveals in sequence,
 *   90ms apart — a cascade that reads clearly on full-height sections.
 *
 * Progressive enhancement: on the server and without JS everything renders
 * fully visible — the hidden start state is applied on the client only. Motion
 * degrades to instant under `prefers-reduced-motion` via the global guard in
 * styles.scss. One-shot: the observer disconnects after the first reveal.
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly platformId = inject(PLATFORM_ID);

  /** Optional single delay (ms) before the host's reveal begins. */
  readonly revealDelay = input(0);

  /** If > 0, reveal direct children this many ms apart instead of the host. */
  readonly revealStagger = input(0);

  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return; // SSR: leave content visible, attach nothing
    }

    const host = this.host.nativeElement;
    const stagger = this.revealStagger();
    const targets: HTMLElement[] =
      stagger > 0 ? (Array.from(host.children) as HTMLElement[]) : [host];

    targets.forEach((el, i) => {
      el.classList.add('reveal');
      const delay = stagger > 0 ? i * stagger : this.revealDelay();
      if (stagger > 0 || delay > 0) {
        el.style.setProperty('--reveal-delay', `${delay}ms`);
      }
    });

    const revealAll = () =>
      targets.forEach((el) => el.classList.add('is-revealed'));

    if (typeof IntersectionObserver === 'undefined') {
      revealAll(); // unsupported: just show
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            revealAll();
            this.observer?.disconnect();
            this.observer = undefined;
          }
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
