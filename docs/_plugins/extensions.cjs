// @ts-check
const fs = require('node:fs');
const path = require('node:path');
const capitalize = require('capitalize');
const _slugify = require('slugify');
const slugify = typeof _slugify === 'function' ? _slugify : _slugify.default;
const exec = require('node:util').promisify(require('node:child_process').exec);
const cheerio = require('cheerio');

/**
 * @param {string} tagName e.g. pf-jazz-hands
 * @param {import("@patternfly/pfe-tools/config.js").PfeConfig} config pfe tools repo config
 */
function getTagNameSlug(tagName, config) {
  const name = config?.aliases?.[tagName] ?? tagName.replace(`${config?.tagPrefix ?? 'rh'}-`, '');
  return slugify(name, {
    strict: true,
    lower: true,
  });
}

/**
 * @param {{ slug: number; }} a first
 * @param {{ slug: number; }} b next
 */
function alphabeticallyBySlug(a, b) {
  return (
      a.slug < b.slug ? -1
    : a.slug > b.slug ? 1
    : 0
  );
}

// Rewrite DEMO lightdom css relative URLs
const LIGHTDOM_HREF_RE = /href="\.(?<pathname>.*-lightdom.*\.css)"/g;
const LIGHTDOM_PATH_RE = /href="\.(.*)"/;

/** Files with these extensions will copy from /elements/foo/docs/ to _site/elements/foo */
const COPY_CONTENT_EXTENSIONS = [
  'svg',
  'png',
  'jpg',
  'jpeg',
  'bmp',
  'webp',
  'webm',
  'mp3',
  'ogg',
  'json',
  'css',
  'js',
  'map',
  'd.ts',
];

/**
 * Generate a map of files per package which should be copied to the site dir
 */
function getFilesToCopy() {
  // Copy element demo files
  const repoRoot = process.cwd();
  const tagNames = fs.readdirSync(path.join(repoRoot, 'elements'), { withFileTypes: true })
    .filter(ent => ent.isDirectory())
    .map(ent => ent.name);

  /** @type {import('@patternfly/pfe-tools/config.js').PfeConfig} */
  const config = require('../../.pfe.config.json');

  // Copy all component and core files to _site
  return Object.fromEntries(tagNames.flatMap(tagName => {
    const slug = getTagNameSlug(tagName, config);
    return Object.entries({
      [`elements/${tagName}/demo/`]: `elements/${slug}/demo`,
      [`elements/${tagName}/docs/**/*.{${COPY_CONTENT_EXTENSIONS.join(',')}}`]: `elements/${slug}`,
    });
  }));
}

/**
 * Replace paths in demo files from the dev SPA's format to 11ty's format
 * @this {EleventyTransformContext}
 * @param {string} content
 */
function demoPaths(content) {
  const { outputPath, inputPath } = this;
  const isNested = outputPath.match(/demo\/.+\/index\.html$/);
  if (inputPath === './docs/elements/demo.html' ) {
    const $ = cheerio.load(content);
    $('[href], [src]').each(function() {
      const el = $(this);
      const attr = el.attr('href') ? 'href' : 'src';
      const val = el.attr(attr);
      if (!val) {
        return;
      }
      if (!val.startsWith('http') && !val.startsWith('/') && !val.startsWith('#')) {
        el.attr(attr, `${isNested ? '../' : ''}${val}`);
      } else if (val.startsWith('/elements/rhx-')) {
        el.attr(attr, val.replace('/elements/rhx-', '/'));
      }
    });
    return $.html();
  }
  return content;
}

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig user config */
module.exports = function(eleventyConfig) {
  eleventyConfig.addFilter('getTitleFromDocs', function(docs) {
    return docs.find(x => x.docsPage?.title)?.alias ??
    docs[0]?.alias ??
    docs[0]?.docsPage?.title ??
    eleventyConfig.getFilter('deslugify')(docs[0]?.slug);
  });

  eleventyConfig.addFilter('makeSentenceCase', function(value) {
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  });

  const filesToCopy = getFilesToCopy();
  eleventyConfig.addPassthroughCopy(filesToCopy, {
    filter: /** @param {string} path pathname */path => !path.endsWith('.html'),
  });


  eleventyConfig.addCollection('elementDocs', async function(collectionApi) {
    const { pfeconfig } = eleventyConfig?.globalData ?? {};

    /**
     * @param {string} filePath
     */
    function getProps(filePath) {
      const [, tagName] = filePath.split(path.sep);
      const absPath = path.join(process.cwd(), filePath);
      /** configured alias for this element e.g. `Call to Action` for `rh-cta` */
      const alias = pfeconfig.aliases[tagName];
      /** e.g. `footer` for `rh-footer` or `call-to-action` for `rh-cta` */
      const slug = getTagNameSlug(tagName, pfeconfig);
      /** e.g. `Code` or `Guidelines` */
      const pageTitle =
        capitalize(filePath.split(path.sep).pop()?.split('.').shift()?.replace(/^\d+-/, '') ?? '');
      const pageSlug = slugify(pageTitle, { strict: true, lower: true });
      /** e.g. `/elements/call-to-action/code/index.html` */
      const overviewHref = `/elements/${slug}/`;
      const permalink =
          pageSlug === 'overview' ? `/elements/${slug}/index.html`
        : `/elements/${slug}/${pageSlug}/index.html`;
      const href = permalink.replace('index.html', '');
      const screenshotPath = `/assets/packages/@rhx/elements/elements/${tagName}/docs/screenshot.png`;
      /** urls for related links */
      const data = {
        tagName,
        filePath,
        absPath,
        alias,
        slug,
        pageTitle,
        pageSlug,
        screenshotPath,
        permalink,
        href,
        overviewHref,
      };
      return data;
    }

    try {
      const { glob } = await import('glob');
      /** @type {(import('@patternfly/pfe-tools/11ty/DocsPage').DocsPage & { repoStatus?: any[] })[]} */
      const elements = await eleventyConfig.globalData?.elements();
      const filePaths = (await glob(`elements/*/docs/*.md`, { cwd: process.cwd() }))
        .filter(x => x.match(/\d{1,3}-[\w-]+\.md$/)); // only include new style docs
      const { repoStatus } = collectionApi.items.find(item => item.data?.repoStatus)?.data || [];
      return filePaths
        .map(filePath => {
          const props = getProps(filePath);
          const docsPage = elements.find(x => x.tagName === props.tagName);
          if (docsPage) {
            docsPage.repoStatus = repoStatus;
          }
          const tabs = filePaths
            .filter(x => x.split('/docs/').at(0) === (`elements/${props.tagName}`))
            .sort()
            .map(x => getProps(x));
          return { docsPage, tabs, ...props };
        })
        .sort(alphabeticallyBySlug);
    } catch (e) {
      // it's important to surface this
      // eslint-disable-next-line no-console
      console.error(e);
      throw e;
    }
  });

  for (const tagName of fs.readdirSync(path.join(process.cwd(), './elements/'))) {
    const dir = path.join(process.cwd(), './elements/', tagName, 'docs/');
    eleventyConfig.addWatchTarget(dir);
  }

  eleventyConfig.addTransform('demo-subresources', demoPaths);

  eleventyConfig.addTransform('demo-lightdom-css', async function(content) {
    const { outputPath, inputPath } = this;
    const { pfeconfig } = eleventyConfig?.globalData ?? {};
    const { aliases } = pfeconfig;

    if (inputPath === './docs/elements/demo.html' ) {
      const tagNameMatch = outputPath.match(/\/elements\/(?<tagName>[-\w]+)\/demo\//);
      if (tagNameMatch) {
        const { tagName } = tagNameMatch.groups;

        // slugify the value of each key in aliases creating a new cloned copy
        const modifiedAliases = Object.fromEntries(Object.entries(aliases).map(([key, value]) => [
          slugify(key, { strict: true, lower: true }),
          value,
        ]));

        // does the tagName exist in the aliases object?
        const key = Object.keys(modifiedAliases).find(key => modifiedAliases[key] === tagName);
        const { deslugify } = await import('@patternfly/pfe-tools/config.js');
        const prefixedTagName = deslugify(tagName, path.join(__dirname, '../..'));
        const redirect = { new: key ?? prefixedTagName, old: tagName };
        const matches = content.match(LIGHTDOM_HREF_RE);
        if (matches) {
          for (const match of matches) {
            const [, path] = match.match(LIGHTDOM_PATH_RE) ?? [];
            const { pathname } = new URL(path, `file:///${outputPath}`);
            const filename = pathname.split('/').pop();
            const replacement = `/assets/packages/@rhx/elements/elements/${prefixedTagName}/${filename}`;
            content = content.replace(`.${path}`, replacement);
          }
        }
      }
    }
    return content;
  });


  /** add the normalized pfe-tools config to global data */
  eleventyConfig.on('eleventy.before', async function() {
    const config = await import('@patternfly/pfe-tools/config.js').then(m => m.getPfeConfig());
    eleventyConfig.addGlobalData('pfeconfig', config);
  });

  /** custom-elements.json */
  eleventyConfig.on('eleventy.before', async function({ runMode }) {
    if (runMode === 'watch') {
      await exec('npx cem analyze');
    }
  });
};
