import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

import styles from './rhx-grid.css';

/**
 * TODO: We don't need shadowdom here, but for the sake of ensuring
 * nothing blows up in dev leaving this file in place for now.
 */

/**
 * Grid
 * @slot - Place element content here
 */
@customElement('rhx-grid')
export class RhxGrid extends LitElement {
  static readonly styles = [styles];

  @property({ reflect: true }) query?: 'media' | 'container' | null = null;

  render() {
    return html`
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-grid': RhxGrid;
  }
}
