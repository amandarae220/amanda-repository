import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';

import { AnalyticsService } from '../../services/analytics.service';
import { HOME_CARDS } from '../../pages/project-detail/project-data';
import { RevealDirective } from '../../shared/reveal.directive';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './work.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./work.component.scss']
})
export class WorkComponent {
  private analytics = inject(AnalyticsService);
  private router    = inject(Router);

  projects = HOME_CARDS;

  goToProject(id: string): void {
    this.analytics.trackProjectClick(id);
    this.router.navigate(['/project', id]);
  }
}
