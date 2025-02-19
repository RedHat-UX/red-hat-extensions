import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

/**
 * Grid Item
 */
@customElement('rhx-grid-item')
export class RhxGridItem extends LitElement {
  /*
  * Change the number of columns this items spans per breakpoint
  * https://ux.redhat.com/tokens/breakpoint/
  */
  @property({ reflect: true, attribute: 'col-span' }) colSpan?: string;

  /*
  * Change where this column starts per breakpoint
  * https://ux.redhat.com/tokens/breakpoint/
  * https://developer.mozilla.org/en-US/docs/Web/CSS/grid-column-start
  */
  @property({ reflect: true, attribute: 'col-start' }) colStart?: string;

  /*
  * Change the number of row this items spans per breakpoint
  * https://ux.redhat.com/tokens/breakpoint/
  */
  @property({ reflect: true, attribute: 'row-span' }) rowSpan?: string;

  /**
   * @ignore
   * Returns the node into which the element should render and by
   * default creates and returns an open shadowRoot.
   **/
  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-grid-item': RhxGridItem;
  }
}
