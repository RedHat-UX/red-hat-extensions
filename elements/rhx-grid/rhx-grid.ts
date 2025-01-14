import { LitElement } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

import './rhx-grid-item.js';

/**
 * Grid
 */
@customElement('rhx-grid')
export class RhxGrid extends LitElement {
  @property({ reflect: true }) columns?: string;

  @property({ reflect: true }) query?: 'media' | 'container' | null = null;

  createRenderRoot() {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-grid': RhxGrid;
  }
}
