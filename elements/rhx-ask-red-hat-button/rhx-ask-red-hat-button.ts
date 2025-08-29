import type { IconNameFor, IconSetName } from '@rhds/icons';

import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { query } from 'lit/decorators/query.js';
import { ifDefined } from 'lit/directives/if-defined.js';

import { InternalsController } from '@patternfly/pfe-core/controllers/internals-controller.js';

import '@rhds/elements/rh-icon/rh-icon.js';

import styles from './rhx-ask-red-hat-button.css';

/**
 * A stylized link or button to the Ask Red Hat AI assistant.
 * @summary A stylized link to the Ask Red Hat AI assistant.
 */
@customElement('rhx-ask-red-hat-button')
export class RhxAskRedHatButton extends LitElement {
  static readonly styles = [styles];

  static readonly formAssociated = true;

  static override readonly shadowRootOptions = {
    ...LitElement.shadowRootOptions,
    delegatesFocus: true,
  };

  #internals = InternalsController.of(this);

  /** Disables the button */
  @property({ reflect: true, type: Boolean }) disabled = false;

  /**
   * button type
   * @see https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#type
   */
  @property({ reflect: true }) type?: 'button' | 'submit' | 'reset';


  /** Accessible name for the button, use when the button does not have slotted text */
  @property({ attribute: 'accessible-label' }) accessibleLabel?: string;

  /** Form value for the button */
  @property() value?: string;

  /** Form name for the button */
  @property() name?: string;

  /** When set overrides the default icon set of 'ui' to the icon set of the icon. */
  @property({ attribute: 'icon-set' }) set: IconSetName = 'ui';

  /** When set overrides the default icon of 'new-fill' to the icon. */
  @property() icon: IconNameFor<IconSetName> = 'new-fill';

  /** When set overrides the default link text of 'Ask Red Hat' to the link text. */
  @property({ attribute: 'button-text' }) buttonText = 'Ask Red Hat';

  @query('button') private _button!: HTMLButtonElement;

  render() {
    return html`
      <button aria-label="${ifDefined(this.accessibleLabel)}"
          part="button"
          type="${ifDefined(this.type)}"
          value="${ifDefined(this.value)}"
          @click="${this.#onClick}"
          aria-disabled=${String(!!this.disabled || !!this.#internals.formDisabled) as 'true' | 'false'}
        >
        <rh-icon icon="${this.icon}" set="${this.set}"></rh-icon>
        <span aria-hidden=${String(!!this.accessibleLabel) as 'true' | 'false'}><slot>${this.buttonText}</slot></span>
      </button>
    `;
  }

  protected async formDisabledCallback() {
    await this.updateComplete;
    this.requestUpdate();
  }

  #onClick() {
    switch (this.type) {
      case 'reset':
        return this.#internals.reset();
      default:
        return this.#internals.submit();
    }
  }

  focus() {
    this._button?.focus();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-ask-red-hat-button': RhxAskRedHatButton;
  }
}
