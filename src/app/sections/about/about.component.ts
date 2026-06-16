import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  private router = inject(Router);
  private analytics = inject(AnalyticsService);

  viewResume(): void {
    this.analytics.trackProjectClick('resume');
    this.router.navigate(['/project', 'resume']);
  }
}
