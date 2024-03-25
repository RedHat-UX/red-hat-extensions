// @ts-check
Error.stackTraceLimit = 50;

const SyntaxHighlightPlugin = require('@11ty/eleventy-plugin-syntaxhighlight');
const DirectoryOutputPlugin = require('@11ty/eleventy-plugin-directory-output');
const AnchorsPlugin = require('@patternfly/pfe-tools/11ty/plugins/anchors.cjs');
const CustomElementsManifestPlugin = require('@patternfly/pfe-tools/11ty/plugins/custom-elements-manifest.cjs');
const OrderTagsPlugin = require('@patternfly/pfe-tools/11ty/plugins/order-tags.cjs');
const TodosPlugin = require('@patternfly/pfe-tools/11ty/plugins/todos.cjs');
const TOCPlugin = require('@patternfly/pfe-tools/11ty/plugins/table-of-contents.cjs');

const path = require('node:path');

const isWatch =
  process.argv.includes('--serve') || process.argv.includes('--watch');

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function(eleventyConfig) {
  eleventyConfig.setQuietMode(true);

  eleventyConfig.watchIgnores.add('**/*.spec.ts');
  eleventyConfig.watchIgnores.add('**/*.d.ts');
  eleventyConfig.watchIgnores.add('**/*.js.map');
  eleventyConfig.watchIgnores.add('elements/*/test/');
  eleventyConfig.watchIgnores.add('lib/elements/*/test/');

  eleventyConfig.on('eleventy.before', function({ runMode }) {
    eleventyConfig.addGlobalData('runMode', runMode);
  });


  /** Table of Contents Shortcode */
  eleventyConfig.addPlugin(TOCPlugin, {
    tags: ['h2', 'h3', 'h4', 'h5', 'h6'],
    wrapperClass: 'table-of-contents',
    headingText: 'Table of Contents'
  });

  /** Bespoke import map for ux-dot pages and demos */
  eleventyConfig.addPassthroughCopy({ 'node_modules/@lit/reactive-element': '/assets/packages/@lit/reactive-element' });
  eleventyConfig.addPassthroughCopy({ 'elements': 'assets/packages/@rhx/elements/elements/' });
  eleventyConfig.addPassthroughCopy({ 'lib': 'assets/packages/@rhx/elements/lib/' });

  eleventyConfig.addPassthroughCopy({ 'node_modules/@rhds/tokens/css/global.css': '/assets/rhds.css' });

  eleventyConfig.addPassthroughCopy({ 'node_modules/@lit/reactive-element': '/assets/packages/@lit/reactive-element' });

  /** Generate and consume custom elements manifests */
  eleventyConfig.addPlugin(CustomElementsManifestPlugin, {
    renderTitleInOverview: false,
  });

  /** Collections to organize by order instead of date */
  eleventyConfig.addPlugin(OrderTagsPlugin, { tags: ['develop'] });

  /** list todos */
  eleventyConfig.addPlugin(TodosPlugin);

  /** fancy syntax highlighting with diff support */
  eleventyConfig.addPlugin(SyntaxHighlightPlugin);

  /** Add IDs to heading elements */
  eleventyConfig.addPlugin(AnchorsPlugin, {
    exclude: /\/elements\/.*\/demo\//,
    formatter($, existingids) {
      if (
        !existingids.includes($.attr('id')) &&
        $.attr('slot') &&
        $.closest('pf-card')
      ) {
        return null;
      } else {
        return eleventyConfig.getFilter('slug')($.text())
          .replace(/[&,+()$~%.'":*?!<>{}]/g, '');
      }
    },
  });

  !isWatch && eleventyConfig.addPlugin(DirectoryOutputPlugin, {
    // Customize columns
    columns: {
      filesize: true, // Use `false` to disable
      benchmark: true, // Use `false` to disable
    },

    // Will show in yellow if greater than this number of bytes
    warningFileSize: 400 * 1000,
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
