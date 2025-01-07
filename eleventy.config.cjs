// @ts-check
Error.stackTraceLimit = 50;

const { EleventyRenderPlugin } = require('@11ty/eleventy');
const CustomElementsManifestPlugin =
  require('@patternfly/pfe-tools/11ty/plugins/custom-elements-manifest.cjs');
const ExtensionsPlugin = require('./docs/_plugins/extensions.cjs');
const ImportMapPlugin = require('./docs/_plugins/import-map.cjs');
const LitPlugin = require('@lit-labs/eleventy-plugin-lit');
const capitalize = require('capitalize');

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
  eleventyConfig.addPassthroughCopy('docs/fonts/**/*');
  eleventyConfig.addPassthroughCopy('docs/images/**/*');
  eleventyConfig.addPassthroughCopy('docs/javascript/**/*');

  /** Bespoke import map for ux-dot pages and demos */
  eleventyConfig.addPassthroughCopy({
    'node_modules/@lit/reactive-element': '/assets/packages/@lit/reactive-element',
  });
  eleventyConfig.addPassthroughCopy({ 'elements': 'assets/packages/@rhx/elements/elements/' });
  eleventyConfig.addPassthroughCopy({ 'lib': 'assets/packages/@rhx/elements/lib/' });

  // ensure icons are copied to the assets dir.
  eleventyConfig.addPassthroughCopy({
    'node_modules/@rhds/icons/': '/assets/packages/@rhds/icons/',
  });

  eleventyConfig.addFilter('deslugify', /** @param {string} slug */ function(slug) {
    return capitalize(slug.replace(/-/g, ' '));
  });

  eleventyConfig.addShortcode('renderlayoutblock', function(name) {
    return (this.layoutblock || {})[name];
  });

  eleventyConfig.addPairedShortcode('layoutblock', function(content, name) {
      if (!this.layoutblock) {
        this.layoutblock = {};
      }
      this.layoutblock[name] = content;
  });

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
        'lit/': '/assets/packages/lit/',
        'lit-html': '/assets/packages/lit-html/lit-html.js',
        'lit-html/': '/assets/packages/lit-html/',
        '@lit-labs/ssr-client/lit-element-hydrate-support.js':
          '/assets/packages/@lit-labs/ssr-client/lit-element-hydrate-support.js',
        '@rhds/tokens': '/assets/packages/@rhds/tokens/js/tokens.js',
        '@rhds/tokens/': '/assets/packages/@rhds/tokens/js/',
        '@rhds/elements/lib/': '/assets/packages/@rhds/elements/lib/',
        '@rhds/elements/': '/assets/packages/@rhds/elements/elements/',
        '@rhds/icons/': '/assets/packages/@rhds/icons/',
        '@rhds/icons/icons.js': '/assets/packages/@rhds/icons/icons.js',
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
      '@rhds/icons/',
      '@rhds/icons/microns/',
      '@rhds/icons/social/',
      '@rhds/icons/standard/',
      '@rhds/icons/ui/',
      '@patternfly/elements',
      '@patternfly/pfe-core',
      // Vendor
      '@floating-ui/core',
      '@floating-ui/dom',
      '@lit-labs/ssr-client/',
      '@lit/context',
      '@lit/reactive-element',
      '@webcomponents/template-shadowroot/template-shadowroot.js',
      'lit',
      'lit-element',
      'lit-html',
      'lit/decorators/custom-element.js',
      'lit/decorators/property.js',
      'lit/directives/class-map.js',
      'lit/directives/if-defined.js',
      'lit/directives/repeat.js',
      'lit/static-html.js',
      'tslib',
    ],
  });

  eleventyConfig.addPlugin(LitPlugin, {
    mode: 'worker',
    componentModules: [
      'docs/javascript/elements/uxdot-masthead/uxdot-masthead.js',
      'docs/javascript/elements/uxdot-header/uxdot-header.js',
      'docs/javascript/elements/uxdot-sidenav/uxdot-sidenav.js',
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
