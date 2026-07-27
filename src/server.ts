import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDistFolder = dirname(fileURLToPath(import.meta.url));
const browserDistFolder = resolve(serverDistFolder, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/**', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Static embedded sub-apps. Each mounts with directory-index resolution so
 * `/subapp/` resolves to `index.html`; must precede the root static-serve so
 * directory-index behavior doesn't leak into the Angular shell.
 */
app.use(
  '/calculator-v2',
  express.static(resolve(browserDistFolder, 'calculator-v2'), {
    maxAge: '1y',
    index: 'index.html',
    redirect: false,
  }),
);

app.use(
  '/dnd',
  express.static(resolve(browserDistFolder, 'dnd'), {
    maxAge: '1y',
    index: 'index.html',
    redirect: false,
  }),
);

app.use(
  '/sudoku',
  express.static(resolve(browserDistFolder, 'sudoku'), {
    maxAge: '1y',
    index: 'index.html',
    redirect: false,
  }),
);

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use('/*splat', (req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url)) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, () => {
    if (process.env['NODE_ENV'] !== 'production') {
      console.log(`Node Express server listening on http://localhost:${port}`);
    }
  });
}

/**
 * The request handler used by the Angular CLI (dev-server and during build).
 */
export const reqHandler = createNodeRequestHandler(app);
