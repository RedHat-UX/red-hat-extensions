import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

import styles from './rhx-grid-item.css';

/**
 * TODO: We don't need shadowdom here, but for the sake of ensuring
 * nothing blows up in dev leaving this file in place for now.
 */


/**
 * Grid
 * @slot - Place element content here
 */
@customElement('rhx-grid-item')
export class RhxGridItem extends LitElement {
  static readonly styles = [styles];

  @property({ reflect: true, attribute: 'col-span' }) colSpan?: string;

  @property({ reflect: true, attribute: 'col-start' }) colStart?: string;

  /**
   * TODO: possibly explore row-span as an option in the future, deemed
   * for now to be more of a use case in a possible `rhx-layout` component.
   * @property({ reflect: true, attribute: 'row-span' }) rowSpan?: string;
   */
  render() {
    return html`
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-grid-item': RhxGridItem;
  }
}
