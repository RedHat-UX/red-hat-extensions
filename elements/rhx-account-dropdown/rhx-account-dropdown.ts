import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';

import styles from './rhx-account-dropdown.css';
import { property, state } from 'lit/decorators.js';

/**
 * Account Dropdown
 * @slot - Place element content here
 */
@customElement('rhx-account-dropdown')
export class RhxAccountDropdown extends LitElement {
  static readonly styles = [styles];
  @property()
  isLoggedIn = false;

  userData = {
    name: 'Chase',
  };
  
  render() {
    return html`
    ${this.isLoggedIn
        ? html`Welcome ${this.userData.name}`
        : html`Please log in`
    }
  `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-account-dropdown': RhxAccountDropdown;
  }
}
