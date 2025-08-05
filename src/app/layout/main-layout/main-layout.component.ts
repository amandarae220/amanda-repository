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
  ngAfterViewInit() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-link');

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          const id = entry.target.getAttribute('id');
          const link = document.querySelector(`.nav-link[data-target="${id}"]`);
          if (entry.isIntersecting && link) {
            navLinks.forEach(link => link.classList.remove('active'));
            link.classList.add('active');
          }
        });
      },
      {
        threshold: 0.5
      }
    );

    sections.forEach(section => observer.observe(section));
  }
}