import { provideZoneChangeDetection } from "@angular/core";
import { bootstrapApplication } from '@angular/platform-browser';
import { RootComponent } from './app/root/root.component';
import { appConfig } from './app/app.config';

bootstrapApplication(RootComponent, {...appConfig, providers: [provideZoneChangeDetection(), ...appConfig.providers]})
  .catch(err => console.error(err));
