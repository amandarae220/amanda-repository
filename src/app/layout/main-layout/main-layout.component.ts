import { Component, AfterViewInit, Renderer2 } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HeroComponent } from '../../sections/hero/hero.component';
import { WorkComponent } from '../../sections/work/work.component';
import { AboutComponent } from '../../sections/about/about.component';
import { ContactComponent } from '../../sections/contact/contact.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, HeroComponent, WorkComponent, AboutComponent, ContactComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements AfterViewInit {
  private sections!: HTMLElement[];
  private navLinks!: HTMLAnchorElement[];
  private ticking = false;
  private activationY = 0; // px from top

  ngAfterViewInit() {
    this.sections = Array.from(document.querySelectorAll<HTMLElement>('section[id]'));
    this.navLinks = Array.from(document.querySelectorAll<HTMLAnchorElement>('.nav-link'));

    const computeActivationY = () => {
      const navH = parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--nav-h') || '72', 10);
      // line at 30% of viewport, but at least just under navbar
      this.activationY = Math.max(navH + 1, Math.round(window.innerHeight * 0.30));
    };

    computeActivationY();
    window.addEventListener('resize', computeActivationY, { passive: true });

    const onScroll = () => {
      if (this.ticking) return;
      this.ticking = true;
      requestAnimationFrame(() => {
        const y = this.activationY;
        let activeId: string | null = null;

        for (const s of this.sections) {
          const r = s.getBoundingClientRect();
          if (r.top <= y && r.bottom > y) {
            activeId = s.id;
            break;
          }
        }

        this.navLinks.forEach(a => {
          const match = a.dataset['target'] === activeId || a.getAttribute('href') === `#${activeId}`;
          a.classList.toggle('active', !!activeId && match);
        });

        this.ticking = false;
      });
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial state
  }

  scrollTo(id: string, e: Event) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}