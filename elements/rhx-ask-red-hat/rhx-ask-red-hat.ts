import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators/custom-element.js';
import { property } from 'lit/decorators/property.js';
import { state } from 'lit/decorators/state.js';

import styles from './rhx-ask-red-hat.css';

interface HydraResponse {
  isEntitled: boolean;
  isInternal: boolean;
}

/**
 * Ask Red Hat is a link that appears if the authenticated user has access to the Ask Red Hat AI assistant.
 */
@customElement('rhx-ask-red-hat')
export class RhxAskRedHat extends LitElement {
  static readonly styles = [styles];

  @state()
  private _hasAccess = false;

  @property({ attribute: false }) href = 'https://access.redhat.com/ask';

  @property({ attribute: false }) healthCheckEndpoint?: string;

  @property({ attribute: false }) hydraEndpoint?: string;

  @property({ attribute: false }) authToken?: string;

  @property({ attribute: false }) userId?: string;

  @property({ attribute: 'link-text' }) linkText = 'Ask Red Hat';

  async updated(): Promise<void> {
    if (await this.#healthCheck()) {
      this._hasAccess = await this.#checkAccess();
    }
  }

  render() {
    return html`
      ${this._hasAccess ? html`
        <a href="${this.href}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="m30.155 17.267-9.422-2-2-9.422a.75.75 0 0 0-1.466 0l-2 9.422-9.422 2a.75.75 0 0 0 0 1.466l9.422 2 2 9.422a.75.75 0 0 0 1.466 0l2-9.422 9.422-2a.75.75 0 0 0 0-1.466ZM6 11.75a.75.75 0 0 0 .733-.595l.775-3.647 3.647-.775a.75.75 0 0 0 0-1.466l-3.647-.775L6.733.845a.75.75 0 0 0-1.466 0l-.775 3.647-3.647.775a.75.75 0 0 0 0 1.466l3.647.775.775 3.647A.75.75 0 0 0 6 11.75Z"></path></svg>
          ${this.linkText}
        </a>
      ` : ``}
    `;
  }

  async #healthCheck(): Promise<boolean> {
    if (!this.healthCheckEndpoint) {
      return false;
    }
    const url = this.healthCheckEndpoint;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      return false;
    }, 10000);

    try {
      const healthCheckApiResponse = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!healthCheckApiResponse.ok) {
        return false;
      }

      const json = await healthCheckApiResponse.json();
      const { status } = json.status;
      if (status === 'OK') {
        clearTimeout(timeoutId);
      }
      return true;
    } catch {
      return false;
    }
  }

  async #checkAccess(): Promise<boolean> {
    if (!this.hydraEndpoint || !this.authToken || !this.userId) {
      sessionStorage.removeItem('ifd-access');
      return false;
    }
    const sessionStore = sessionStorage.getItem('ifd-access');
    if (sessionStore !== null) {
      return (sessionStore === 'true');
    } else {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        return false;
      }, 10000);
      const options = {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'X-User-ID': this.userId,
        },
      };
      const response = await fetch(`${this.hydraEndpoint}`, options);
      const data = await response.json() as HydraResponse;
      if (data && (data.isEntitled || data.isInternal)) {
        sessionStorage.setItem('ifd-access', 'true');
        clearTimeout(timeoutId);
        return true;
      } else {
        sessionStorage.setItem('ifd-access', 'false');
        clearTimeout(timeoutId);
        return false;
      }
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'rhx-ask-red-hat': RhxAskRedHat;
  }
}
