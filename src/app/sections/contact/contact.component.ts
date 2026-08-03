import { Component, ChangeDetectionStrategy } from '@angular/core';

import { RevealDirective } from '../../shared/reveal.directive';


@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RevealDirective],
  templateUrl: './contact.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./contact.component.scss']
})
export class ContactComponent {}
