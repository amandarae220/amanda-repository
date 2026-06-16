import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { RootComponent } from './app/root/root.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) => bootstrapApplication(RootComponent, config, context);

export default bootstrap;
