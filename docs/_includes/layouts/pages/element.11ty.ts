import type { ElementDocsPageData } from '#11ty-plugins/element-docs.js';
import type { ClassMethod } from 'custom-elements-manifest';
import type { DemoRecord } from '@patternfly/pfe-tools/custom-elements-manifest/custom-elements-manifest.js';

import { tokens } from '@rhds/tokens/meta.js';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import { copyCell, getTokenHref } from '#11ty-plugins/tokensHelpers.js';
import { AssetCache } from '@11ty/eleventy-fetch';
import { Renderer } from '#eleventy.config';
import type { ImportMap } from '#11ty-plugins/importMap.js';

// type FileEntry = [string, FileOptions & { inline: string }];

const html = String.raw; // for editor highlighting


function stringifyParams(method: ClassMethod) {
  return method.parameters?.map?.(p =>
    `${p.name}: ${p.type?.text ?? 'unknown'}`).join(', ') ?? '';
}

interface EleventyPageRenderData {
  page: {
    outputPath: string;
    inputPath: string;
    url: string;
  };
}

interface Context extends EleventyPageRenderData {
  doc: ElementDocsPageData;
  cdnVersion?: string;
  level?: number;
  tagName: string;
  isLocal: boolean;
  importMap: { imports: Record<string, string>; scopes: Record<string, Record<string, string>> };
  // playgrounds: Record<`rhx-${string}`, ProjectManifest>;
  demos: DemoRecord[];
}

export default class ElementsPage extends Renderer<Context> {
  static assetCache = new AssetCache<ImportMap>('rhx-import-map-jspmio');

  data() {
    return {
      layout: 'layouts/pages/has-toc.html',
      permalink: ({ doc }: Context) => doc.permalink,
      eleventyComputed: {
        title: ({ doc }: Context) => doc.pageTitle,
        tagName: ({ doc }: Context) => doc.tagName,
      },
    };
  }

  async render(ctx: Context) {
    const { doc } = ctx;
    const {
      fileExists,
      filePath,
      isCodePage,
      isDemoPage,
      isOverviewPage,
      tagName,
      planned,
    } = doc;
    const content = fileExists ? await this.renderFile(filePath, ctx) : '';
    const stylesheets = [
      '/assets/packages/@rhds/elements/elements/rh-table/rh-table-lightdom.css',
      '/styles/samp.css',
      ctx.doc.hasLightdom && `/assets/packages/@rhdx/elements/elements/${tagName}/${tagName}-lightdom.css`,
      isCodePage && '/styles/pages/code.css',
    ].filter(Boolean);

    return html`${stylesheets.map(x => html`
      <link rel="stylesheet" data-helmet href="${x}">`).join('')}

      <noscript data-helmet>
        <style>
        rh-audio-player:not([expanded]) rh-transcript:not(:defined) {
          display: block;
        }
        </style>
      </noscript>

      <script type="module" data-helmet>
        import '@uxdot/elements/uxdot-copy-button.js';
        import '@uxdot/elements/uxdot-copy-permalink.js';
        import '@uxdot/elements/uxdot-best-practice.js';
        import '@rhds/elements/rh-alert/rh-alert.js';
        import '@rhds/elements/rh-cta/rh-cta.js';
        import '@rhds/elements/rh-surface/rh-surface.js';
        import '@rhds/elements/rh-code-block/rh-code-block.js';
        import '@rhds/elements/rh-table/rh-table.js';
        import '@rhds/elements/rh-accordion/rh-accordion.js';
        import '@rhds/elements/rh-badge/rh-badge.js';
        import '@rhds/elements/rh-tag/rh-tag.js';
      </script>

      ${planned ? '' : html`
      <script type="module" data-helmet>
        import '@rhdx/elements/${tagName}/${tagName}.js';
      </script>`}

      ${isOverviewPage ? await this.#renderOverviewPage(content, ctx)
      : isCodePage ? await this.#renderCodePage(ctx)
      : isDemoPage ? await this.#renderDemos(ctx)
      : content}

      ${await this.renderFile('./docs/_includes/partials/_feedback.11ty.ts', ctx)}
    `;
  }

  #actionsLabels = html`
    <span slot="action-label-copy">Copy to Clipboard</span>
    <span slot="action-label-copy" hidden data-code-block-state="active">Copied!</span>
    <span slot="action-label-wrap">Wrap lines</span>
    <span slot="action-label-wrap" hidden data-code-block-state="active">Overflow lines</span>
  `;

  async #innerMD(content = '') {
    return (await this.renderTemplate(content.trim(), 'md')).trim();
  }

  async #getMainDemoContent(tagName: string) {
    try {
      const demoPath = join(process.cwd(), 'elements', tagName, 'demo', `${tagName}.html`);
      const demoContent = await readFile(demoPath, 'utf8');
      return html`
        <rh-code-block actions="wrap copy" highlighting="prerendered">
          ${this.highlight('html', demoContent)}
          ${this.#actionsLabels}
        </rh-code-block>`;
    } catch {
      return '';
    }
  }

  async #renderOverviewPage(content: string, ctx: Context) {
    const description = ctx.doc.docsPage.description ?? ctx.doc.description ?? '';
    return html`${!ctx.doc.planned ? '' : html`
      <h2 id="coming-soon">Coming soon!</h2>
      <p>This element is currently in progress and not yet available for
      use.</p>`}
      <h2 id="overview">Overview</h2>
      ${await this.renderTemplate(description, 'md')}
      ${!ctx.doc.overviewImageHref ? '' : html`
      <uxdot-example><img src="${ctx.doc.overviewImageHref}" alt="" aria-labelledby="overview-image-description"></uxdot-example>`}
      <h2 id="sample-element">Sample element</h2>
      ${ctx.doc.mainDemoContent}
      ${content}
    `;
  }

  async #renderCodePage(ctx: Context) {
    const { doc } = ctx;
    const { tagName } = doc.docsPage;
    return [
      await this.#renderInstallation(),
      await this.#renderLightdom(ctx),
      html`<h2 id="usage">Usage</h2>`,
      await this.#getMainDemoContent(tagName),
      doc.fileExists && await this.renderFile(doc.filePath, ctx),
      await this.#renderCodeDocs.call(this,
                                      doc.docsPage.tagName,
                                      { ...ctx, level: (ctx.level ?? 2) + 1 }),
      ...await Promise.all(doc.siblingElements.map(tagName =>
        this.#renderCodeDocs.call(this, tagName, ctx))),
    ].filter(Boolean).join('');
  }

  async #renderLightdom(ctx: Context) {
    const { docsPage } = ctx.doc;
    let content = '';
    // TODO: revisit after implementing auto-loaded light-dom css
    if (ctx.doc.hasLightdom) {
      content += html`
        <h3 id="lightdom-css">Lightdom CSS</h3>

        <p>This element requires you to load "Lightdom CSS" stylesheets for styling
           deeply slotted elements.</p>

        <rh-alert state="info">
          <h4 id="lightdom-css-note" slot="header">Note</h4>
          <p>Replace <code>/path/to/</code> with path to the CSS file, whether local or CDN.</p>
        </rh-alert>

        <rh-code-block actions="copy" highlighting="prerendered">
          ${this.highlight('html', html`
          <link rel="stylesheet" href="/path/to/${docsPage.tagName}/${docsPage.tagName}-lightdom.css">
          `.trim())}
        </rh-code-block>
      `;
    }
    if (ctx.doc.hasLightdomShim) {
      content += html`
        <h3 id="lightdom-css-shim">Lightdom CSS shim</h3>

        <rh-alert state="warning">
          <h4 slot="header">Warning</h4>
          <p>Lightdom CSS shims are an optional, temporary solution for reducing
             <abbr title="cumulative layout shift">CLS</abbr>.
             <a href="/get-started/developers/installation/#lightdom-css-shims">
               Learn more about lightdom CSS shims
             </a>.</p>
        </rh-alert>

        <rh-code-block actions="copy" highlighting="prerendered">
          ${this.highlight('html', html`
          <link rel="stylesheet" href="/path/to/${docsPage.tagName}/${docsPage.tagName}-lightdom-shim.css">
          `.trim())}
        </rh-code-block>

        <rh-alert state="info">
          <h4 slot="header">Note</h4>
          <p>Replace <code>/path/to/</code> with path to the CSS file, whether local or CDN.</p>
        </rh-alert>
      `;
    }
    return content;
  }

  async #renderInstallation() {
    return html``;
  }

  async #renderCodeDocs(tagName: string, ctx: Context) {
    const { docsPage } = ctx.doc;
    const { manifest } = docsPage;

    const h = ctx.level ?? 2;

    // TODO: dsd
    return html`
      <h${h} id="${tagName}-apis">${tagName}</h${h}>

      <p>${manifest.getDescription(tagName)}</p>

      <rh-accordion box>
        ${await this.#renderSlots(tagName, ctx)}
        ${await this.#renderAttributes(tagName, ctx)}
        ${await this.#renderMethods(tagName, ctx)}
        ${await this.#renderEvents(tagName, ctx)}
        ${await this.#renderCssParts(tagName, ctx)}
        ${await this.#renderCssCustomProperties(tagName, ctx)}
        ${await this.#renderDesignTokens(tagName, ctx)}
      </rh-accordion>
    `;;
  }

  async #renderSlots(tagName: string, ctx: Context) {
    const level = ctx.level ?? 2;
    const allSlots = ctx.doc.docsPage.manifest.getSlots(tagName) ?? [];
    const slots = allSlots.filter(x => !x.deprecated);
    const deprecated = allSlots.filter(x => x.deprecated);
    const count = slots.length;
    const deprecatedSlotCount = deprecated.length;

    return html`
      <rh-accordion-header id="${tagName}-slots" ${!count ? '' : 'expanded'}>Slots
        <rh-badge>${count}</rh-badge>
        ${deprecatedSlotCount > 0 ? html`<rh-badge state="moderate">${deprecatedSlotCount}</rh-badge>` : ``}
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="slots">
          ${!slots.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table>
              <thead>
                <tr>
                  <th scope="col">Slot Name</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                ${(await Promise.all(slots.map(async slot => html`
                <tr>
                  <td><code>${slot.name}</code></td>
                  <td>${await this.#innerMD(slot.description)}</td>
                </tr>`))).join('')}
              </tbody>
            </table>
          </rh-table>`}${!deprecated.length ? '' : html`
          <details>
            <summary><h${level + 1}>Deprecated Slots</h${level + 1}></summary>
            <rh-table>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Slot Name</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${(await Promise.all(deprecated.map(async slot => html`
                  <tr>
                    <td><code>${slot.name}</code></td>
                    <td>
                      ${await this.#innerMD(slot.description)}
                      <em>Note: ${slot.name} is deprecated. ${await this.#innerMD(String(slot.deprecated ?? ''))}</em>
                    </td>
                  </tr>`))).join('')}
                </tbody>
              </table>
            </rh-table>
          </details>`}
        </section>
      </rh-accordion-panel>`;
  }

  async #renderAttributes(tagName: string, ctx: Context) {
    const level = ctx.level ?? 2;
    const _attrs = (ctx.doc.docsPage.manifest.getAttributes(tagName) ?? []);
    const deprecated = _attrs.filter(x => x.deprecated);
    const attributes = _attrs.filter(x => !x.deprecated);
    const count = _attrs.length;
    const deprecatedAttrCount = deprecated.length;

    return html`
      <rh-accordion-header id="${tagName}-attributes" ${!count ? '' : 'expanded'}>Attributes
        <rh-badge>${count}</rh-badge>
        ${deprecatedAttrCount > 0 ? html`<rh-badge state="moderate">${deprecatedAttrCount}</rh-badge>` : ``}
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="attributes">${!attributes.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table>
              <thead>
                <tr>
                  <th scope="col">Attribute</th>
                  <th scope="col">DOM Property</th>
                  <th scope="col">Description</th>
                  <th scope="col">Type</th>
                  <th scope="col">Default</th>
                </tr>
              </thead>
              <tbody>
                ${(await Promise.all(attributes.map(async attribute => html`
                <tr>
                  <td><code>${attribute.name}</code></td>
                  <td><code>${attribute.fieldName}</code></td>
                  <td>${await this.#innerMD(attribute.description)}</td>
                  <td class="type">${this.highlight('ts', attribute?.type?.text ?? 'unknown').replace(/\s+/g, ' ')}</td>
                  <td class="type">${this.highlight('ts', attribute?.default ?? 'unknown').replace(/\s+/g, ' ')}</td>
                </tr>`))).join('')}
              </tbody>
            </table>
          </rh-table>`}
          ${!deprecated.length ? '' : html`
          <details>
            <summary><h${level + 1}>Deprecated Attributes<h${level + 1}></summary>
            <rh-table>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Attribute</th>
                    <th scope="col">DOM Property</th>
                    <th scope="col">Description</th>
                    <th scope="col">Type</th>
                    <th scope="col">Default</th>
                  </tr>
                </thead>
                <tbody>
                  ${(await Promise.all(deprecated.map(async attribute => html`
                  <tr>
                    <td><code>${attribute.name}</code></td>
                    <td><code>${attribute.fieldName}</code></td>
                    <td>${await this.#innerMD(attribute.description)}</td>
                    <td class="type">${this.highlight('ts', attribute.type?.text ?? 'unknown').replace(/\s+/g, ' ')}</td>
                    <td class="type">${this.highlight('ts', attribute.default ?? 'unknown').replace(/\s+/g, ' ')}</td>
                  </tr>`))).join('')}
                </tbody>
              </table>
            </rh-table>
          </details>`}
        </section>
      </rh-accordion-panel>
    `;
  }

  async #renderMethods(tagName: string, ctx: Context) {
    const level = ctx.level ?? 2;
    const allMethods = ctx.doc.docsPage.manifest.getMethods(tagName) ?? [];
    const deprecated = allMethods.filter(x => x.deprecated);
    const methods = allMethods.filter(x => !x.deprecated);
    const count = methods.length;
    const deprecatedMethodsCount = deprecated.length;

    // TODO: inline code highlighting for type and default: render the markdown to html and extract the `<code>` from the `<pre>`
    return html`
      <rh-accordion-header id="${tagName}-methods" ${!count ? '' : 'expanded'}>Methods
        <rh-badge>${count}</rh-badge>
        ${deprecatedMethodsCount > 0 ? html`<rh-badge state="moderate">${deprecatedMethodsCount}</rh-badge>` : ``}
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="methods">
          ${!methods.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table>
              <thead>
                <tr>
                  <th scope="col">Method Name</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                ${(await Promise.all(methods.map(async method => html`
                <tr>
                  <td><code>${method.name}(${stringifyParams(method)})</code></td>
                  <td>${await this.#innerMD(method.description)}</td>
                </tr>`))).join('')}
              </tbody>
            </table>
          </rh-table>`}${!deprecated.length ? '' : html`
          <details>
            <summary><h${level + 1}>Deprecated Methods</h${level + 1}></summary>
            <rh-table>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Method Name</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${(await Promise.all(deprecated.map(async method => html`
                  <tr>
                    <td><code>${method.name}(${stringifyParams(method)})</code></td>
                    <td>
                      ${await this.#innerMD(method.description)}
                      <em>Note: ${method.name} is deprecated. ${await this.#innerMD((method.deprecated ?? '').toString())}</em>
                    </td>
                  </tr>`))).join('')}
                </tbody>
              </table>
            </rh-table>
          </details>`}
        </section>
      </rh-accordion-panel>
    `;
  }

  async #renderEvents(tagName: string, ctx: Context) {
    const level = ctx.level ?? 2;
    const _events = ctx.doc.docsPage.manifest.getEvents(tagName) ?? [];
    const deprecated = _events.filter(x => x.deprecated);
    const events = _events.filter(x => !x.deprecated);
    const count = events.length;
    const deprecatedEventsCount = deprecated.length;

    return html`
      <rh-accordion-header id="${tagName}-events" ${!count ? '' : 'expanded'}>Events
        <rh-badge>${count}</rh-badge>
        ${deprecatedEventsCount > 0 ? html`<rh-badge state="moderate">${deprecatedEventsCount}</rh-badge>` : ``}
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="events">
          ${!events.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table>
              <thead>
                <tr>
                  <th scope="col">Event Name</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                ${(await Promise.all(events.map(async event => html`
                <tr>
                  <td><code>${event.name}</code></td>
                  <td>${await this.#innerMD(event.description)}</td>
                </tr>`))).join('')}
              </tbody>
            </table>
          </rh-table>`}${!deprecated.length ? '' : html`
          <details>
            <summary><h${level + 1}>Deprecated Events</h${level + 1}></summary>
            <rh-table>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Event Name</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${(await Promise.all(deprecated.map(async event => html`
                  <tr>
                    <td><code>${event.name}</code></td>
                    <td>
                      ${await this.#innerMD(event.description)}
                      <em>Note: ${event.name} is deprecated. ${await this.#innerMD((event.deprecated ?? '').toString())}</em>
                    </td>
                  </tr>`))).join('')}
                </tbody>
              </table>
            </rh-table>
          </details>`}
        </section>
      </rh-accordion-panel>
    `;
  }

  async #renderCssParts(tagName: string, ctx: Context) {
    const level = ctx.level ?? 2;
    const allParts = ctx.doc.docsPage.manifest.getCssParts(tagName) ?? [];
    const parts = allParts.filter(x => !x.deprecated);
    const deprecated = allParts.filter(x => x.deprecated);
    const count = parts.length;
    const deprecatedCssPartsCount = deprecated.length;

    return html`
      <rh-accordion-header id="${tagName}-css-parts" ${!count ? '' : 'expanded'}>CSS Shadow Parts
        <rh-badge>${count}</rh-badge>
        ${deprecatedCssPartsCount > 0 ? html`<rh-badge state="moderate">${deprecatedCssPartsCount}</rh-badge>` : ``}
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="css-shadow-parts">
          ${!parts.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table>
              <thead>
                <tr>
                  <th scope="col">Part Name</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                ${(await Promise.all(parts.map(async part => html`
                <tr>
                  <td><code>${part.name}</code></td>
                  <td>${await this.#innerMD(part.description)}</td>
                </tr>`))).join('')}
              </tbody>
            </table>
          </rh-table>`}${!deprecated.length ? '' : html`
          <details>
            <summary><h${level + 1}>Deprecated CSS Shadow Parts</h${level + 1}></summary>
            <rh-table>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Part Name</th>
                    <th scope="col">Description</th>
                  </tr>
                </thead>
                <tbody>
                  ${(await Promise.all(deprecated.map(async part => html`
                  <tr>
                    <td><code>${part.name}</code></td>
                    <td>
                      ${await this.#innerMD(part.description)}
                      <em>Note: ${part.name} is deprecated. ${await this.#innerMD((part.deprecated ?? '').toString())}</em>
                    </td>
                  </tr>`))).join('')}
                </tbody>
              </table>
            </rh-table>
          </details>`}
        </section>
      </rh-accordion-panel>
    `;
  }

  async #renderCssCustomProperties(tagName: string, ctx: Context) {
    const level = ctx.level ?? 2;
    const allCssProperties = (ctx.doc.docsPage.manifest.getCssCustomProperties(tagName) ?? [])
        .filter(x => !tokens.has(x.name));
    const cssProperties = allCssProperties.filter(x => !x.deprecated);
    const deprecated = allCssProperties.filter(x => x.deprecated);
    const count = cssProperties.length;
    const deprecatedCssPropertiesCount = deprecated.length;

    return html`
      <rh-accordion-header id="${tagName}-css-properties" ${!count ? '' : 'expanded'}>CSS Custom Properties
        <rh-badge>${count}</rh-badge>
        ${deprecatedCssPropertiesCount > 0 ? html`<rh-badge state="moderate">${deprecatedCssPropertiesCount}</rh-badge>` : ``}
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="css-custom-properties">
          ${!cssProperties.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table class=css-custom-properties>
              <thead>
                <tr>
                  <th scope="col">CSS Property</th>
                  <th scope="col">Description</th>
                  <th scope="col">Default</th>
                </tr>
              </thead>
              <tbody>${(await Promise.all(cssProperties.map(async prop => html`
                <tr>
                  <td><code>${prop.name}</code></td>
                  <td>${await this.#innerMD(prop.description ?? '')}</td>
                  <td>
                    ${!prop.default?.startsWith('#') ? html`<code>` : html`<code data-color="${prop.default}" style="--color:${prop.default}">`}${prop.default ?? '—'}</code>
                  </td>
                </tr>`))).join('')}
              </tbody>
            </table>
          </rh-table>`}${!deprecated.length ? '' : html`
          <details>
            <summary><h${level + 1}>Deprecated CSS Custom Properties</h${level + 1}></summary>
            <rh-table>
              <table>
                <thead>
                  <tr>
                    <th scope="col">CSS Property</th>
                    <th scope="col">Description</th>
                    <th>Default</th>
                  </tr>
                </thead>
                <tbody>${(await Promise.all(deprecated.map(async prop => html`
                  <tr>
                    <td><code>${prop.name}</code></td>
                    <td>${await this.#innerMD(prop.description)}</td>
                    <td>${await this.#innerMD(prop.default ?? '—')}</td>
                  </tr>`))).join('')}
                </tbody>
              </table>
            </rh-table>
          </details>`}
        </section>
      </rh-accordion-panel>
    `;
  }

  async #renderDesignTokens(tagName: string, ctx: Context) {
    const designTokens = (ctx.doc.docsPage.manifest.getCssCustomProperties(tagName) ?? [])
        .filter(x => tokens.has(x.name));
    const count = designTokens.length;
    return html`
      <rh-accordion-header id="${tagName}-design-tokens" ${!count ? '' : 'expanded'}>Design Tokens
        <rh-badge>${count}</rh-badge>
      </rh-accordion-header>
      <rh-accordion-panel>
        <section class="design-tokens">
          ${!designTokens.length ? html`
          <em>None</em>` : html`
          <rh-table>
            <table>
              <thead>
                <tr>
                  <th>Token</th>
                  <th>Copy</th>
                </tr>
              </thead>
              <tbody>${designTokens.map(token => html`
                <tr>
                  <td>
                    <a href="${getTokenHref(token)}">
                      <code>${token.name}</code>
                    </a>
                  </td>
                  ${copyCell(token)}
                </tr>`).join('')}
              </tbody>
            </table>
          </rh-table>`}
        </section>
      </rh-accordion-panel>
    `;
  }

  async #renderDemos(ctx: Context) {
    const demos = ctx.demos.map((demo: DemoRecord) => {
      return html`
        <rh-tile>
          <h2 slot="headline"><a href="${demo.permalink}">${demo.title}</a></h2>
        </rh-tile>
      `;
    });
    return html`
      <script type="module" data-helmet>
        import '@rhds/elements/rh-tile/rh-tile.js';
      </script>
      <link rel="stylesheet" href="/assets/packages/@rhds/elements/elements/rh-tile/rh-tile-lightdom.css">
      <h2>Demos</h2>
      <ul class="grid xs-two-columns">
        ${demos.join('')}
      </ul>
    `;
  }

  // async #renderDemoHead() {
  //   return html`
  //     <style data-helmet>
  //       playground-project {
  //         height: 825px;
  //         &:fullscreen {
  //           height: 100vh;
  //           & rh-card {
  //             height: 100%;
  //             &::part(body) {
  //               flex: auto;
  //             }
  //           }
  //           & playground-file-editor,
  //           & playground-preview {
  //             height: 100%;
  //           }
  //         }
  //         &:not(:defined) { opacity: 0; }
  //         display: flex;
  //         flex-flow: column;
  //         gap: var(--rh-space-sm);
  //         --playground-code-background: var(--rh-color-surface-lighter);
  //         & playground-preview {
  //           border: var(--rh-border-width-sm) solid var(--rh-color-border-subtle-on-light);
  //           &::part(preview-toolbar) {
  //             display: none;
  //           }
  //         }
  //         & rh-card {
  //           &::part(header),
  //           &::part(body) { margin: 0; }
  //           &::part(footer) {
  //             margin-block: var(--rh-space-lg);
  //             justify-content: end;
  //           }
  //           &::part(body) {
  //             border-block-end: var(--rh-border-width-sm) solid var(--rh-color-border-subtle-on-light);
  //           }
  //           & rh-button[slot="footer"] {
  //             display: inline-block;
  //             margin-inline-end: auto;
  //           }
  //         }
  //         & rh-tab-panel {
  //           display: none !important;
  //         }
  //       }
  //     </style>

  //     <script type="module" data-helmet>
  //       import '@uxdot/elements/uxdot-copy-button.js';
  //       import '@uxdot/elements/uxdot-header.js';
  //       import '@rhds/elements/rh-button/rh-button.js';
  //       import '@rhds/elements/rh-card/rh-card.js';
  //       import '@rhds/elements/rh-code-block/rh-code-block.js';
  //       import '@rhds/elements/rh-cta/rh-cta.js';
  //       import '@rhds/elements/rh-footer/rh-footer.js';
  //       import '@rhds/elements/rh-subnav/rh-subnav.js';
  //       import '@rhds/elements/rh-surface/rh-surface.js';
  //       import '@rhds/elements/rh-tabs/rh-tabs.js';
  //       import {TabExpandEvent} from '@rhds/elements/rh-tabs/rh-tab.js';
  //       for (const tabs of document.querySelectorAll('.demo-fileswitcher')) {
  //         tabs.addEventListener('expand', function(event) {
  //           if (event instanceof TabExpandEvent && event.active) {
  //             const { filename } = event.tab.dataset;
  //             if (filename) {
  //               const project = tabs.closest('playground-project');
  //               const fileEditor = project.querySelector('playground-file-editor');
  //               if (fileEditor) {
  //                 fileEditor.filename = filename;
  //               }
  //             }
  //           }
  //         })
  //       }
  //       for (const playground of document.querySelectorAll('playground-project')) {
  //         playground.addEventListener('click', function(event) {
  //           if (event.target.dataset?.action === 'fullscreen') {
  //             playground.requestFullscreen();
  //           }
  //         })
  //       }
  //     </script>
  //   `;
  // }

  /**
   * Files to include with every demo playground e.g. import map, shared styles, etc.
   * Some of these are generated by /scripts/playgrounds.ts
   * @param ctx
   * @param entries
   */
  // async #renderPlaygroundsCommon(ctx: Context, entries: FileEntry[]) {
  //   const { isLocal, importMap: { imports } } = ctx;
  //   const baseUrl = process.env.DEPLOY_PRIME_URL || 'http://localhost:8080';
  //   return html`${isLocal ? html`
  //     <script type="sample/importmap">${JSON.stringify({ imports }, null, 2).replaceAll('"/assets', `"${baseUrl}/assets`)}</script>` : html`
  //     <script type="sample/importmap">
  //       {
  //         "imports": {
  //           "@patternfly/icons/": "https://ux.redhat.com/assets/packages/@patternfly/icons/"
  //         }
  //       }
  //     </script>`}${entries.map(([filename, config]) => config.label ? '' : html`
  //     <script type="sample/${filename.split('.').pop()}" filename="${filename}" ${!config.hidden ? '' : 'hidden'}>${
  //     config.content?.replace('</' + 'script>', '&lt;/script>') ?? ''
  //   }</script>`).join('')}
  //   `;
  // }

  // async #renderPlaygrounds(ctx: Context, entries: FileEntry[]) {
  //   const common = await this.#renderPlaygroundsCommon(ctx, entries);
  //   return entries.map(([filename, config]) => this.#renderPlayground(
  //     filename,
  //     config,
  //     ctx,
  //     common,
  //     entries
  //         .filter(([, config]) => config.inline === filename)
  //         .map(([s]) => s)

  //   ));
  // };

  // #renderPlayground(
  //   filename: string,
  //   config: FileOptions,
  //   ctx: Context,
  //   common: string,
  //   inlineResources: string[],
  // ) {
  //   const { doc, tagName, isLocal } = ctx;
  //   const { slug } = doc;
  //   if (!config.label) {
  //     return '';
  //   } else {
  //     const labelSlug = this.slugify(config.label);
  //     const extension = filename.split('.').pop();
  //     const demoSlug =
  //       filename.split('.').shift()?.replace('demo/', '').replaceAll('/', '-') ?? '';
  //     const projectId = `playground-${tagName}-${demoSlug}`;
  //     const demoPageUrl = `/elements/${slug}/demo/${demoSlug === 'index' ? '' : `${labelSlug}/`}`;
  //     const githubSourcePrefix = `https://github.com/RedHat-UX/red-hat-design-system/tree/main/elements`;
  //     const githubSourceUrl = `${githubSourcePrefix}/${tagName}/demo/${filename
  //         .replace('demo/', '')
  //         .replace('/index.html', '')
  //         .replace('.html', '')
  //         .replace('index', tagName)}.html`;

  //     const content = config.content?.replace('</' + 'script>', '&lt;/script>') ?? '';
  //     return html`
  //       <h2 id="demo-${labelSlug}">${config.label}</h2>
  //       <playground-project id="${projectId}" ${!isLocal ? '' : 'sandbox-base-url="http://localhost:8080"'}>
  //         ${common}
  //         <script type="sample/${extension}" filename="${filename}">${content}</script>
  //         <playground-preview project="${projectId}" html-file="${filename}"></playground-preview>
  //         <rh-card>
  //           <rh-tabs slot="header" class="demo-fileswitcher">
  //             <rh-tab slot="tab" data-filename="${filename}">HTML</rh-tab>
  //             <rh-tab-panel hidden></rh-tab-panel>
  //             ${inlineResources.map(subresourcename => html`
  //             <rh-tab slot="tab" data-filename="${subresourcename}">${subresourcename.split('.').pop()?.toUpperCase() ?? ''}</rh-tab>
  //             <rh-tab-panel hidden></rh-tab-panel>`).join('')}
  //           </rh-tabs>
  //           <playground-file-editor project="${projectId}"
  //                                   filename="${filename}"
  //                                   line-numbers></playground-file-editor>
  //           <rh-button slot="footer" variant="tertiary" data-action="fullscreen" icon="expand">FullScreen</rh-button>
  //           <rh-cta slot="footer" href="${githubSourceUrl}">View source on GitHub</rh-cta>
  //           <rh-cta slot="footer" href="${demoPageUrl}">View In Own Tab</rh-cta>
  //         </rh-card>
  //       </playground-project>
  //     `;
  //   }
  // }
};

