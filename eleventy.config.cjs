// @ts-check
Error.stackTraceLimit = 50;

const { EleventyRenderPlugin } = require('@11ty/eleventy');
const CustomElementsManifestPlugin =
  require('@patternfly/pfe-tools/11ty/plugins/custom-elements-manifest.cjs');
const ExtensionsPlugin = require('./docs/_plugins/extensions.cjs');
const ImportMapPlugin = require('./docs/_plugins/import-map.cjs');

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.setQuietMode(true);

  eleventyConfig.watchIgnores?.add('**/*.spec.ts');
  eleventyConfig.watchIgnores?.add('**/*.d.ts');
  eleventyConfig.watchIgnores?.add('**/*.js.map');
  eleventyConfig.watchIgnores?.add('elements/*/test/');
  eleventyConfig.watchIgnores?.add('lib/elements/*/test/');

  eleventyConfig.on('eleventy.before', function({ runMode }) {
    eleventyConfig.addGlobalData('runMode', runMode);
  });

  eleventyConfig.addPassthroughCopy('docs/styles/**/*');

  /** Bespoke import map for ux-dot pages and demos */
  eleventyConfig.addPassthroughCopy({
    'node_modules/@lit/reactive-element': '/assets/packages/@lit/reactive-element',
  });
  eleventyConfig.addPassthroughCopy({ 'elements': 'assets/packages/@rhx/elements/elements/' });
  eleventyConfig.addPassthroughCopy({ 'lib': 'assets/packages/@rhx/elements/lib/' });

  eleventyConfig.addPlugin(EleventyRenderPlugin);

  /** Generate and consume custom elements manifests */
  eleventyConfig.addPlugin(CustomElementsManifestPlugin, {
    renderTitleInOverview: false,
  });

  // Extensions specific
  eleventyConfig.addPlugin(ExtensionsPlugin);
  eleventyConfig.addPlugin(ImportMapPlugin, {
    nodemodulesPublicPath: '/assets/packages',
    manualImportMap: {
      imports: {
        '@rhx/elements/': '/assets/packages/@rhx/elements/elements/',
        '@rhds/elements/lib/': '/assets/packages/@rhds/elements/lib/',
        '@rhds/elements/': '/assets/packages/@rhds/elements/elements/',
        '@patternfly/elements/': '/assets/packages/@patternfly/elements/',
        '@patternfly/icons/': '/assets/packages/@patternfly/icons/',
        '@patternfly/pfe-core/': '/assets/packages/@patternfly/pfe-core/',
      },
    },
    localPackages: [
      // ux-dot dependencies
      'fuse.js',
      'element-internals-polyfill',

      // RHDS dependencies
      // `manualImportMap` is not traced, so we need to manually specify these
      //
      // 1st party
      '@rhds/tokens',
      '@rhds/tokens/media.js',
      '@rhds/tokens/meta.js',
      '@rhds/elements',
      '@rhds/elements/lib/',
      '@patternfly/elements',
      '@patternfly/icons/far/',
      '@patternfly/icons/fas/',
      '@patternfly/icons/fab/',
      '@patternfly/icons/patternfly/',
      '@patternfly/pfe-core',
      // Vendor
      '@floating-ui/core',
      '@floating-ui/dom',
      '@lit-labs/ssr-client/',
      '@lit-labs/ssr-client/lit-element-hydrate-support.js',
      '@lit/context',
      '@lit/reactive-element',
      'lit',
      'lit-element',
      'lit/directives/class-map.js',
      'lit/directives/if-defined.js',
      'lit/directives/repeat.js',
      'lit/static-html.js',
      'tslib',
    ],
  });

  return {
    templateFormats: ['html', 'md', 'njk', '11ty.cjs'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    dir: {
      input: './docs',
    },
  };
};
