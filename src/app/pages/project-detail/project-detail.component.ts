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
      image: 'assets/saux-preview.png',
      url: 'https://yourusername.github.io/sudoku' 
    },
    sudoku: {
      title: 'Sudoku Puzzle',
      subtitle: 'React & Typescript',
      description: `Sudoku is a puzzle that I've long enjoyed so I wanted to re-create an interactive version.
                    This version utilizes React, Typescript, and is hosted using GitHub Pages.`,
      image: 'assets/sudoku.png',
      url: 'https://amandarae220.github.io/sudoku/' 
    },
    resume: {
      title: 'Interactive Resume',
      subtitle: 'D3.js & GitHub Pages',
description: `This resume visualization reimagines what a data driven, interactive resume could look like. It uses D3.js to turn timelines and skills into interactive data art.`,
      image: 'assets/interactiveResume.png',
      url: 'https://amandarae220.github.io/interactiveResume/'
    },
    calculator: {
      title: 'Retirement Calculator',
      subtitle: 'D3.js & GitHub Pages',
      description: 'An interactive calculator that visualizes compound interest over time. Users can adjust savings, timeline, and returns to see how your money could grow. No spreadsheets required.',
      image: 'assets/retirementCalculator.png',
      url: 'https://amandarae220.github.io/Calculator2.0/'
    },
    website: {
      title: 'This website... duh',
      subtitle: 'Angular, Typescript, GitHub Pages',
      description: `This website, in and of itself, showcases my skill set with Angular and Typescript. This portfolio is more than a static site, it’s a full-featured app that showcases my approach to user experience, accessibility, and a sprinkle of personality.`,
      image: 'assets/portfolio-preview.png',
      url: 'https://www.amandarae.dev'
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
