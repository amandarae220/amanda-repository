import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AnalyticsService } from '../../services/analytics.service';
import { HOME_CARDS } from '../../pages/project-detail/project-data';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [],
  templateUrl: './work.component.html',
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
