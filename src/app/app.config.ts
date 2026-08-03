import {
  ActivatedRouteSnapshot,
  provideRouter,
  withInMemoryScrolling,
  withViewTransitions,
} from '@angular/router';
import { routes } from './app.routes';

/** Deepest matched route path, e.g. '' for home or 'project/:id' for detail. */
function leafPath(snapshot: ActivatedRouteSnapshot | null): string {
  let s = snapshot;
  while (s?.firstChild) {
    s = s.firstChild;
  }
  return s?.routeConfig?.path ?? '';
}

export const appConfig = {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'enabled', anchorScrolling: 'enabled' }),
      withViewTransitions({
        skipInitialTransition: true,
        // Tag <html> with the navigation direction so CSS can slide horizontally:
        // into a project = forward (left→right), back to landing = reverse.
        onViewTransitionCreated: ({ transition, from, to }) => {
          const root = document.documentElement;
          const toProject = leafPath(to).startsWith('project');
          const fromProject = leafPath(from).startsWith('project');

          root.classList.remove('vt-forward', 'vt-back');
          if (toProject && !fromProject) {
            root.classList.add('vt-forward');
          } else if (fromProject && !toProject) {
            root.classList.add('vt-back');
          }

          transition.finished.finally(() => {
            root.classList.remove('vt-forward', 'vt-back');
          });
        },
      })
    )
  ]
};
