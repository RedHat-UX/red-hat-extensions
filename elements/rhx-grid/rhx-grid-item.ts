import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

/**
 * Grid Item
 */
@customElement('rhx-grid-item')
export class RhxGridItem extends LitElement {
  @property({ reflect: true, attribute: 'col-span' }) colSpan?: string;

  @property({ reflect: true, attribute: 'col-start' }) colStart?: string;

  @property({ reflect: true, attribute: 'row-span' }) rowSpan?: string;

  /**
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
