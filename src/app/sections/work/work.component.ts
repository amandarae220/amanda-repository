import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-work',
  standalone: true,
  imports: [],
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.scss']
})
export class WorkComponent {
  private analytics = inject(AnalyticsService);
  constructor(private router: Router) {}

  projects = [
    {
      id: 'resume',
      title: 'Interactive Resume',
      subtitle: 'Tableau → D3.js → Angular',
      description: 'The resume reimagined. This aims to intuitively answer the most common resume questions that result from gaps in the traditional resume.',
      buttonText: 'VIEW RESUME VIZ'
    },
    {
      id: 'calculator',
      title: 'Retirement Calculator',
      subtitle: 'D3.js & Vanilla JS',
      description: 'A retirement calculator built to replace the overwhelming, question-heavy tools that make you want to close the tab. Clean inputs, a chart that means something, and insights that show what your money is quietly working toward.',
      buttonText: 'VIEW CALCULATOR'
    },
    {
      id: 'saux',
      title: 'Saux Component Library',
      subtitle: 'React, Typescript, Storybook, Git, Npm',
      description: 'A modular React component library built from scratch with TypeScript, featuring Storybook for documentation, and published to Npm.',
      buttonText: 'VIEW STORYBOOK'
    },
    {
      id: 'dnd',
      title: 'D&D Mini Game',
      subtitle: 'HTML, CSS, JavaScript',
      description: 'A fun little mini-game that simulates the basics of Dungeons & Dragons, showcasing skills in HTML, CSS, and JavaScript.',
      buttonText: 'VIEW GAME'
    },
    {
      id: 'sudoku',
      title: 'Sudoku Puzzle',
      subtitle: 'React & Typescript',
      description: 'An interactive sudoku puzzle built with React and Typescript.',
      buttonText: 'VIEW PUZZLE'
    },
    {
      id: 'website',
      title: 'This website... duh',
      subtitle: 'Angular, Typescript, Vercel',
      description: 'This Angular-built portfolio site showcases my skill set with Angular and Typescript, while showcasing my other projects.',
      buttonText: 'YOU ARE HERE'
    }
  ];

  goToProject(id: string) {
    this.analytics.trackProjectClick(id);
    this.router.navigate(['/project', id]);
  }
}
