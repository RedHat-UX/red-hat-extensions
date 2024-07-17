// @ts-check
import { pfeDevServerConfig } from '@patternfly/pfe-tools/dev-server/config.js';

export const litcssOptions = {
  include: (/** @type{string[]}*/(/** @type{unknown}*/([
    /elements\/rhx-[\w-]+\/[\w-]+\.css$/,
    /lib\/.*\.css$/,
  ]))),
  exclude: /lightdom/,
};

export default pfeDevServerConfig({
  litcssOptions,
  tsconfig: 'tsconfig.json',
  middleware: [
    /** redirect requests for lightdom css to /elements */
    function(ctx, next) {
      const match = ctx.path.match(/^\/components\/(?<slug>[-\w]+)\/(?<path>.*)\.css$/);
      if (match) {
        const { slug, path } = /** @type{{ slug: string; path: string }} */ (match.groups);
        ctx.redirect(`/elements/rhx-${slug}/${path}.css`);
      }
      return next();
    },
    /** redirect requests for /assets/* css to /docs/assets/prism.css */
    function(ctx, next) {
      if (ctx.path.startsWith('/assets/')) {
        ctx.redirect(`/docs${ctx.path}`);
      }
      return next();
    }
  ],
  plugins: [
    {
      name: 'watch-demos',
      serverStart(args) {
        const fsDemoFilesGlob = new URL('./elements/*/demo/**/*.html', import.meta.url).pathname;
        args.fileWatcher.add(fsDemoFilesGlob);
        args.app.use(function(ctx, next) {
          if (ctx.path.match(/\/|\.css|\.html|\.js$/)) {
            ctx.etag = `e${Math.random() * Date.now()}`;
          }
          return next();
        });
      },
    },
  ],
});
