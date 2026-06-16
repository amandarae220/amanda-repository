import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { AnalyticsService } from '../../services/analytics.service';
import { Project, PROJECT_MAP } from './project-data';

const BASE_TITLE = 'Amanda Lloyd — Frontend Engineer & Data Visualization Specialist';
const BASE_DESC  = 'Portfolio of Amanda Lloyd — Frontend Engineer and Data Visualization Specialist. Angular, React, D3.js, and a data science background that makes the difference.';
const BASE_URL   = 'https://www.amandarae.dev';
const BASE_IMAGE = `${BASE_URL}/assets/white-background-hero-img.png`;

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private analytics = inject(AnalyticsService);
  private titleSvc  = inject(Title);
  private metaSvc   = inject(Meta);
  private route     = inject(ActivatedRoute);
  private location  = inject(Location);

  private pageEnteredAt = 0;
  projectId: string | null = null;
  projectData: Project | null = null;

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId && PROJECT_MAP[this.projectId]) {
      this.projectData = PROJECT_MAP[this.projectId];
    }
    this.setMeta();
    this.pageEnteredAt = Date.now();
    this.analytics.trackPageView(`/project/${this.projectId}`);
  }

  ngOnDestroy(): void {
    const duration = Math.round((Date.now() - this.pageEnteredAt) / 1000);
    this.analytics.trackPageExit(`/project/${this.projectId}`, duration);
    this.resetMetaToBase();
  }

  trackLinkClick(label: string): void {
    this.analytics.trackLinkClick(label, `/project/${this.projectId}`);
  }

  private setMeta(): void {
    if (!this.projectData) return;
    const title = `${this.projectData.title} | Amanda Lloyd`;
    const desc  = this.projectData.description.slice(0, 155);
    const image = `${BASE_URL}/${this.projectData.image}`;
    const url   = `${BASE_URL}/project/${this.projectId}`;

    this.titleSvc.setTitle(title);
    this.metaSvc.updateTag({ name: 'description', content: desc });
    this.metaSvc.updateTag({ property: 'og:title', content: title });
    this.metaSvc.updateTag({ property: 'og:description', content: desc });
    this.metaSvc.updateTag({ property: 'og:url', content: url });
    this.metaSvc.updateTag({ property: 'og:image', content: image });
    this.metaSvc.updateTag({ name: 'twitter:title', content: title });
    this.metaSvc.updateTag({ name: 'twitter:description', content: desc });
    this.metaSvc.updateTag({ name: 'twitter:image', content: image });
    this.metaSvc.updateTag({ name: 'robots', content: 'index, follow' });
  }

  private resetMetaToBase(): void {
    this.titleSvc.setTitle(BASE_TITLE);
    this.metaSvc.updateTag({ name: 'description', content: BASE_DESC });
    this.metaSvc.updateTag({ property: 'og:title', content: BASE_TITLE });
    this.metaSvc.updateTag({ property: 'og:description', content: BASE_DESC });
    this.metaSvc.updateTag({ property: 'og:url', content: BASE_URL });
    this.metaSvc.updateTag({ property: 'og:image', content: BASE_IMAGE });
    this.metaSvc.updateTag({ name: 'twitter:title', content: BASE_TITLE });
    this.metaSvc.updateTag({ name: 'twitter:description', content: BASE_DESC });
    this.metaSvc.updateTag({ name: 'twitter:image', content: BASE_IMAGE });
  }
}
