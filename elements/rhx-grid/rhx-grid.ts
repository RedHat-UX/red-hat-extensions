import { LitElement } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

import './rhx-grid-item.js';

/**
 * A responsive grid based off the Design Program Office (DPO) standardized design specifications. 
 * @summary Responsive grid
 * 
 * @cssprop {<integer>} [--rhx-grid-columns=12] - number of columns
 * @cssprop {<integer>} [--rhx-grid-rows=1] - number of rows
 * @cssprop {<integer>} [--rhx-grid-column-gap=16] - value in px of spacing between columns
 * @cssprop {<integer>} [--rhx-grid-row-gap=16] - value in px of spacing between rows
 */
@customElement('rhx-grid')
export class RhxGrid extends LitElement {
  @property({ reflect: true }) columns?: string;

  @property({ reflect: true }) query?: 'media' | 'container' | null = null;

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
    'rhx-grid': RhxGrid;
  }
}
