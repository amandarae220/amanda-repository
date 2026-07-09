import { Component, inject, DOCUMENT, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-hero',
  imports: [],
  templateUrl: './hero.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './hero.component.scss'
})
export class HeroComponent {
  private document = inject(DOCUMENT);

  scrollTo(id: string, event: Event): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
