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
      description: `A resume that IS the portfolio piece. Three iterations, from Tableau to D3.js to pure Angular, each one more purposefully built than the last. v3 is fully dynamic, accessibility tested, and designed for every screen from the start.`,
      image: 'assets/resume-hero-img.png',
      buttons: [
        { label: 'View v3 Resume', url: 'https://amandarae-web-resume.dev/' },
      ],
      versions: [
        {
          version: 'v1',
          label: 'The Tableau Era',
          year: '2020',
          image: 'assets/resume-v1.png',
          url: 'https://public.tableau.com/app/profile/amanda.lloyd/viz/ResumeViz-2ndDraft/Dashboard12',
          highlights: [
            'Proved the concept: a resume can be a data visualization',
            'No-code BI tooling, explored the idea for the sake of the idea, not the final product',
            'Gantt-style career timeline paired with a hexagonal skills map',
            'Desktop-only, no mobile consideration'
          ]
        },
        {
          version: 'v2',
          label: 'Going Web Native',
          year: '2022',
          image: 'assets/interactiveResume.png',
          url: 'https://amandarae220.github.io/interactiveResume/',
          highlights: [
            'Rebuilt with open source tooling (D3.js + Angular) for full developer control',
            'Deployed as a real web app, no BI tooling required',
            'Slight visual updates breaking out the role details from a hover tooltip to a dedicated panel to accommodate mobile users',
            'Mobile users prompted to rotate their screen, functional but not a real solution'
          ]
        },
        {
          version: 'v3',
          label: 'Architecture Over Tooling',
          year: '2026',
          image: 'assets/resume-v3.png',
          url: 'https://amandarae-web-resume.dev/',
          highlights: [
            'Dropped D3.js in favor of pure Angular/CSS timeline positioning math',
            'Nested project-based role descriptions within parent roles to better showcase the work and skills within each project',
            'Skill-chip filtering highlights matching roles across the full timeline',
            'Custom mobile layout built from the ground up, no rotation prompt needed',
            'Fully dynamic across all viewports; accessibility tested to WCAG 2.1 AA'
          ]
        }
      ],
      lessonsLearned: [
        {
          heading: 'Data science background meets frontend engineering. A dynamic duo.',
          body: 'Most frontend engineers debug a bad chart at the component level. A data science background means knowing to check the data model first. When something looks off, the question isn\'t just whether it\'s a rendering bug, it\'s whether the underlying data makes sense to begin with. That dual-discipline instinct catches problems earlier and shapes better decisions about what to build.'
        },
        {
          heading: 'Prototyping in the wrong tool actually saved time',
          body: 'v1 in Tableau wasn\'t the lazy path. It was the right one. Steve Jobs said "If you correctly define the problem you almost have the answer". Being pragmatic, efficient, and cost effective isn\'t always sexy, but the prototyping tool doesn\'t matter; the hypothesis does.'
        },
        {
          heading: 'The best architecture is one you can delete',
          body: 'v3 dropped D3.js, not because D3 isn\'t powerful, but because Angular and CSS already handle positioning and state without the SVG overhead. Removing a well-known library takes more confidence than adding one. Knowing when a dependency becomes a liability is invaluable.'
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
