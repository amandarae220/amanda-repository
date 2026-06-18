import { Component, AfterViewInit, OnInit, Renderer2, inject, DOCUMENT } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';

import { HeroComponent } from '../../sections/hero/hero.component';
import { WorkComponent } from '../../sections/work/work.component';
import { AboutComponent } from '../../sections/about/about.component';
import { ContactComponent } from '../../sections/contact/contact.component';
import { SiteFooterComponent } from '../site-footer/site-footer.component';

const BASE_TITLE = 'Amanda Lloyd — Frontend Engineer & Data Visualization Specialist';
const BASE_DESC  = 'Portfolio of Amanda Lloyd — Frontend Engineer and Data Visualization Specialist. Angular, React, D3.js, and a data science background that makes the difference.';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterModule, HeroComponent, WorkComponent, AboutComponent, ContactComponent, SiteFooterComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss']
})
export class MainLayoutComponent implements OnInit, AfterViewInit {
  private titleSvc  = inject(Title);
  private metaSvc   = inject(Meta);
  private document  = inject(DOCUMENT);
  private renderer  = inject(Renderer2);
  private sections!: HTMLElement[];
  private navLinks!: HTMLAnchorElement[];
  private ticking = false;
  private activationY = 0;

  ngOnInit(): void {
    this.titleSvc.setTitle(BASE_TITLE);
    this.metaSvc.updateTag({ name: 'description', content: BASE_DESC });
    this.metaSvc.updateTag({ property: 'og:title', content: BASE_TITLE });
    this.metaSvc.updateTag({ property: 'og:description', content: BASE_DESC });
    this.metaSvc.updateTag({ property: 'og:url', content: 'https://www.amandarae.dev/' });
    this.metaSvc.updateTag({ name: 'twitter:title', content: BASE_TITLE });
    this.metaSvc.updateTag({ name: 'twitter:description', content: BASE_DESC });
    this.injectJsonLd({
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Amanda Lloyd',
      jobTitle: 'Frontend Engineer & Data Visualization Specialist',
      url: 'https://www.amandarae.dev',
      sameAs: ['https://github.com/amandarae220', 'https://www.linkedin.com/in/amandaraedev/'],
      knowsAbout: ['Angular', 'React', 'D3.js', 'TypeScript', 'Data Visualization', 'WCAG Accessibility'],
    });
  }

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
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private injectJsonLd(schema: object): void {
    const script = this.renderer.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    this.renderer.appendChild(this.document.head, script);
  }
}