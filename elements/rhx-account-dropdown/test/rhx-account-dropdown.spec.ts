import { expect, html } from '@open-wc/testing';
import { createFixture } from '@patternfly/pfe-tools/test/create-fixture.js';
import { RhxAccountDropdown } from '@rhx/elements/rhx-account-dropdown/rhx-account-dropdown.js';

describe('<rhx-account-dropdown>', function() {
  describe('simply instantiating', function() {
    let element: RhxAccountDropdown;
    it('imperatively instantiates', function() {
      expect(document.createElement('rhx-account-dropdown')).to.be.an.instanceof(RhxAccountDropdown);
    });

    it('should upgrade', async function() {
      element = await createFixture<RhxAccountDropdown>(html`<rhx-account-dropdown></rhx-account-dropdown>`);
      const klass = customElements.get('rhx-account-dropdown');
      expect(element)
        .to.be.an.instanceOf(klass)
        .and
        .to.be.an.instanceOf(RhxAccountDropdown);
    });
  })
});
