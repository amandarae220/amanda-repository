import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SafeUrlPipe } from '../../pipes/safe-url.pipe';
import { Location } from '@angular/common';
import { AnalyticsService } from '../../services/analytics.service';

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, SafeUrlPipe],
  templateUrl: './project-detail.component.html',
  styleUrls: ['./project-detail.component.scss']
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private analytics = inject(AnalyticsService);
  private pageEnteredAt = 0;
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
      description: 'A retirement calculator built to replace the overwhelming, question-heavy tools that make you want to close the tab. Clean inputs, a chart that means something, and insights that surface the milestones your money is quietly working toward.',
      image: 'assets/calculator-v2.png',
      buttons: [
        { label: 'View v2 Calculator', url: 'https://amandarae220.github.io/Calculator2.0/' },
      ],
      versions: [
        {
          version: 'v1',
          label: 'Proving the Concept',
          year: '2023',
          image: 'assets/retirementCalculator.png',
          url: 'https://amandarae220.github.io/Calculator2.0/v1/',
          highlights: [
            'Compound interest visualization with a D3.js stacked bar chart',
            'Simple input set: starting amount, rate, years, and contribution',
            'Showed that a chart alone can make retirement math feel approachable'
          ]
        },
        {
          version: 'v2',
          label: 'A Tool Worth Using',
          year: '2026',
          image: 'assets/calculator-v2.png',
          url: 'https://amandarae220.github.io/Calculator2.0/',
          highlights: [
            'Key Insights panel automatically surfaces financial milestones from the data',
            'Coast FI, Die with Zero, and Skim the Top withdrawal modeling built in',
            'Chart annotations mark the exact year interest overtakes contributions',
            'Scenario naming and saving for side-by-side comparison',
            'Employer contribution and Coast FI spend inputs added'
          ]
        }
      ],
      lessonsLearned: [
        {
          heading: 'Insights over output',
          body: 'A typical calculator returns a number. The Key Insights panel in v2 derives what that number means at different life stages — when interest lifts off, when it hits the tipping point, what you can safely spend in retirement. That\'s the data science instinct applied to UI: the tool should interpret the data, not just display it.'
        },
        {
          heading: 'Build the tool you wish existed',
          body: 'Austin Kleon writes about making the art you want to see in the world. The same logic applies here. Most retirement calculators online are visually overwhelming, front-loading a wall of questions that make you want to close the tab before you even get to the chart. This one was built because that tool didn\'t exist yet — clean inputs, a chart that tells you something meaningful, and insights that do the math so you don\'t have to.'
        },
        {
          heading: 'Annotations make the invisible visible',
          body: 'The Year 7 and Year 17 markers on the chart show the exact moments interest overtakes your contributions. That inflection point exists in every retirement projection but most tools never surface it. Good data visualization doesn\'t just show the numbers, it points to what matters.'
        }
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
    }
    this.pageEnteredAt = Date.now();
    this.analytics.trackPageView(`/project/${this.projectId}`);
  }

  ngOnDestroy(): void {
    const duration = Math.round((Date.now() - this.pageEnteredAt) / 1000);
    this.analytics.trackPageExit(`/project/${this.projectId}`, duration);
  }

  trackLinkClick(label: string): void {
    this.analytics.trackLinkClick(label, `/project/${this.projectId}`);
  }
}
