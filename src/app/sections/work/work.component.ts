import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss']
})
export class WorkComponent {
  projects = [
    {
      title: 'Sudoku Puzzle',
      subtitle: 'React & Typescript',
      description: 'An interactive sudoku puzzle built with React and Typescript, hosted with GitHub Pages.',
      buttonText: 'VIEW PUZZLE'
    },
    {
      title: 'Interactive Resume',
      subtitle: 'D3.js & GitHub Pages',
      description: 'A web based visualization of resume information in a more interactive format using D3.js.',
      buttonText: 'VIEW RESUME VIZ'
    },
    {
      title: 'Retirement Calculator',
      subtitle: 'D3.js & GitHub Pages',
      description: 'An interactive calculator that computes and visualizes the power of compounding interest over time.',
      buttonText: 'VIEW CALCULATOR'
    }
  ];
}
