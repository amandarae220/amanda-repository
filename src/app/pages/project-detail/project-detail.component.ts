import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { Location } from '@angular/common';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit {
  projectId: string | null = null;
  projectData: any;

  projectMap: Record<string, any> = {
    saux: {
      title: 'Saux Component Library',
      subtitle: 'React, Typescript, Storybook, Git, Npm',
      description: `Showingcasing both my technical and collaborative skillsets, this component library is built with React and Typescript. It features Storybook for documentation and is published to Npm.`,
      image: 'assets/SAUX STORYBOOK.png',
      buttons: [
      { label: 'View Storybook', url: 'https://tassyguy.github.io/saux-component-library/' },
      { label: 'View GitHub Repo', url: 'https://github.com/tassyguy/saux-component-library' }
    ]
    },
    dnd: {
      title: 'Dungeons & Dragons Mini Game',
      subtitle: 'HTML, CSS, JavaScript, GitHub Pages',
      description: `I'd rather be playing Dungeons & Dragons, but since I can't always be doing that, I built a mini-game that simulates a D&D encounter. This project showcases my skills in HTML, CSS, and JavaScript, and is hosted on GitHub Pages.`,
      image: 'assets/D&D.png',
      buttons: [
      { label: 'Play Game', url: 'https://amandarae220.github.io/DungeonsAndDragons/' }, 
    ]
    },
    sudoku: {
      title: 'Sudoku Puzzle',
      subtitle: 'React & Typescript',
      description: `Sudoku is a puzzle that I've long enjoyed so I wanted to re-create an interactive version.
                    This version utilizes React, Typescript, and is hosted using GitHub Pages.`,
      image: 'assets/sudoku.png', 
      buttons: [
        { label: 'View Storybook', url: 'https://amandarae220.github.io/sudoku/' },
      ]
    },
    resume: {
      title: 'Interactive Resume',
      subtitle: 'Tableau → D3.js → Angular',
      description: `A resume that IS the portfolio piece. Three iterations — from Tableau to D3.js to pure Angular — documenting both a career and an evolving approach to data visualization.`,
      image: 'assets/interactiveResume.png',
      buttons: [
        { label: 'View v2 Resume', url: 'https://amandarae220.github.io/interactiveResume/' },
      ],
      versions: [
        {
          version: 'v1',
          label: 'The Tableau Era',
          year: '2020',
          image: 'assets/resume-v1-tableau.png',
          url: 'https://public.tableau.com/app/profile/amanda.lloyd/viz/ResumeViz-2ndDraft/Dashboard12',
          highlights: [
            'Proved the concept: a resume can be a data visualization',
            'No-code BI tooling — explored the idea before writing a single line of code',
            'Gantt-style career timeline paired with a hexagonal skills map'
          ]
        },
        {
          version: 'v2',
          label: 'Going Web Native',
          year: '2022',
          image: 'assets/interactiveResume.png',
          url: 'https://amandarae220.github.io/interactiveResume/',
          highlights: [
            'Rebuilt in D3.js + Angular — full developer control over rendering',
            'Deployed as a real web app, no BI tooling required',
            'Clickable timeline with role detail panels and skill hexagons'
          ]
        },
        {
          version: 'v3',
          label: 'Architecture Over Tooling',
          year: '2025',
          image: null,
          url: null,
          comingSoon: true,
          highlights: [
            'Dropped D3.js — pure Angular/CSS timeline positioning math',
            'Nested engagement drill-down within parent roles',
            'Skill-chip filtering highlights matching roles across the full timeline'
          ]
        }
      ],
      lessonsLearned: [
        {
          heading: 'A data background makes you a better engineer',
          body: 'Coming from Tableau and data science first means understanding what I\'m visualizing before writing a component. When a chart looks "off," I know whether it\'s a rendering bug or a data modeling decision. That domain fluency — knowing the problem, not just the stack — is what turns a UI developer into a product engineer.'
        },
        {
          heading: 'Proving a concept in the wrong tool is still proof',
          body: 'v1 in Tableau wasn\'t the lazy path — it was the right one. Validating that an interactive, data-driven resume is legible and useful before writing a single component is the same instinct senior engineers show when they prototype in a spreadsheet before spinning up a service. The tool doesn\'t matter; the hypothesis does.'
        },
        {
          heading: 'The best architecture is one you can delete',
          body: 'v3 dropped D3.js — not because D3 isn\'t powerful, but because Angular and CSS already handle positioning and state without the SVG overhead. Removing a well-known library takes more confidence than adding one. Knowing when a dependency becomes a liability is the kind of judgment you can\'t learn from a tutorial.'
        }
      ]
    },
    calculator: {
      title: 'Retirement Calculator',
      subtitle: 'D3.js & GitHub Pages',
      description: 'An interactive calculator that visualizes compound interest over time. Users can adjust savings, timeline, and returns to see how your money could grow. No spreadsheets required.',
      image: 'assets/retirementCalculator.png',
      buttons: [
        { label: 'View Calculator', url: 'https://amandarae220.github.io/Calculator2.0/' },
      ]
    },
    website: {
      title: 'This website... duh',
      subtitle: 'Angular, Typescript, GitHub Pages',
      description: `This website, in and of itself, showcases my skill set with Angular and Typescript. This portfolio is more than a static site, it’s a full-featured app that showcases my approach to user experience, accessibility, and a sprinkle of personality.`,
      image: 'assets/PORTFOLIO IMAGE.png',
      buttons: [
        { label: 'Go to homepage', url: 'https://www.amandarae.dev' },
      ]
    }
  };

  constructor(
    private route: ActivatedRoute,
    private location: Location
  ) {}

  goBack(): void {
    this.location.back();
  }

  ngOnInit(): void {
    this.projectId = this.route.snapshot.paramMap.get('id');
    if (this.projectId && this.projectMap[this.projectId]) {
      this.projectData = this.projectMap[this.projectId];
      console.log('Resolved projectData:', this.projectData); // ✅ now correct
    } else {
      console.warn('No matching project found for ID:', this.projectId);
    }
  }
}
