import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss']
})
export class WorkComponent {
  constructor(private router: Router) {}

  projects = [
    {
      id: 'saux',
      title: 'Saux Component Library',
      subtitle: 'React, Typescript, Storybook, Git, Npm',
      description: 'A modular React component library built from scratch with TypeScript, featuring Storybook for documentation, and published to Npm.',
      buttonText: 'VIEW STORYBOOK'
    },
    {
      id: 'sudoku',
      title: 'Sudoku Puzzle',
      subtitle: 'React & Typescript',
      description: 'An interactive sudoku puzzle built with React and Typescript, hosted with GitHub Pages.',
      buttonText: 'VIEW PUZZLE'
    },
    {
      id: 'resume',
      title: 'Interactive Resume',
      subtitle: 'D3.js & GitHub Pages',
      description: 'The resume reimagined. This D3 visualization turns timelines and skills into interactive data art.',
      buttonText: 'VIEW RESUME VIZ'
    },
    {
      id: 'calculator',
      title: 'Retirement Calculator',
      subtitle: 'D3.js & GitHub Pages',
      description: 'A D3-powered, interactive calculator that visualizes the power of compounding interest over time.',
      buttonText: 'VIEW CALCULATOR'
    },
    {
      id: 'website',
      title: 'This website... duh',
      subtitle: 'Angular, Typescript, GitHub Pages',
      description: 'This Angular-built portfolio site showcases my skill set with Angular and Typescript, while showcasing my other projects.',
      buttonText: 'YOU ARE HERE'
    }
  ];

  goToProject(id: string) {
    this.router.navigate(['/project', id]);
  }
}
