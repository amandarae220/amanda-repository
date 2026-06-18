import { Component, OnInit, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { SiteFooterComponent } from '../../layout/site-footer/site-footer.component';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [SiteFooterComponent],
  templateUrl: './privacy.component.html',
  styleUrls: ['./privacy.component.scss'],
})
export class PrivacyComponent implements OnInit {
  private titleSvc = inject(Title);
  private metaSvc  = inject(Meta);

  readonly lastUpdated = 'June 18, 2026';
  readonly contactEmail = 'amandaraedev@gmail.com';

  ngOnInit(): void {
    this.titleSvc.setTitle('Privacy Policy | Amanda Lloyd');
    this.metaSvc.updateTag({ name: 'description', content: 'How amandarae.dev handles visitor analytics — what is collected, why, and how to opt out.' });
    this.metaSvc.updateTag({ name: 'robots', content: 'index, follow' });
  }
}
