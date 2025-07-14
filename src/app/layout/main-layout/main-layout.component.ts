import { Component } from '@angular/core';
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
export class MainLayoutComponent {}
