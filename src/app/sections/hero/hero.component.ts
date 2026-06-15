import { Component, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  private document = inject(DOCUMENT);

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
