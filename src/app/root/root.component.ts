import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-root',
  imports: [RouterModule],
  templateUrl: './root.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './root.component.scss'
})
export class RootComponent {

}
