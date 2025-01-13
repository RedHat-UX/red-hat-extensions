import { Renderer, type GlobalData } from '#eleventy.config';
import { dedent } from '#11ty-plugins/tokensHelpers.js';
import type { ElementDocsPageData } from '#11ty-plugins/element-docs.js';

const html = String.raw; // for editor highlighting

interface Data {
  title: string;
  doc: ElementDocsPageData;
}

export default class Feedback extends Renderer<Data> {
  async render({ doc, title }: Data & GlobalData) {
    const name = doc?.tagName ?? this.slugify(title);
    return dedent(html`
      <script type="module" data-helmet>
        import '@uxdot/elements/uxdot-feedback.js';
      </script>
      <uxdot-feedback>
        <h2>Other libraries</h2>
        <p>To learn more about our other libraries, visit the <a href="https://ux.redhat.com/get-started/">getting started page</a>.</p>
      </uxdot-feedback>
    `).replaceAll('\n+', '\n');
  }
};

