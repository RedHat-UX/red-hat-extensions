import type { IconNameFor, IconSetName } from '@rhds/icons';

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';

import '@rhds/elements/rh-icon/rh-icon.js';

import styles from './rhx-ask-red-hat.css';

/**
 * A stylized link or button to the Ask Red Hat AI assistant.
 * @summary A stylized link to the Ask Red Hat AI assistant.
 */
@customElement('rhx-ask-red-hat')
export class RhxAskRedHat extends LitElement {
  static readonly styles = [styles];

  /** When set overrides the default link of https://access.redhat.com/ask to the Ask Red Hat AI assistant. */
  @property() href = 'https://access.redhat.com/ask';

  /** When set overrides the default icon set of 'ui' to the icon set of the icon. */
  @property({ attribute: 'icon-set' }) set: IconSetName = 'ui';

  /** When set overrides the default icon of 'new-fill' to the icon. */
  @property() icon: IconNameFor<IconSetName> = 'new-fill';

  /** When set overrides the default link text of 'Ask Red Hat' to the link text. */
  @property({ attribute: 'link-text' }) linkText = 'Ask Red Hat';

  render() {
    return html`
      <a href="${this.href}">
        <rh-icon icon="${this.icon}" set="${this.set}"></rh-icon>
        ${this.linkText}
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-ask-red-hat': RhxAskRedHat;
  }
}
