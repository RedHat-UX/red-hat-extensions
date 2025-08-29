import { expect, html } from '@open-wc/testing';
import { createFixture } from '@patternfly/pfe-tools/test/create-fixture.js';
import { RhxAskRedHatButton } from '@rhdx/elements/rhx-ask-red-hat-button/rhx-ask-red-hat-button.js';

describe('<rhx-ask-red-hat-button>', function() {
  describe('simply instantiating', function() {
    let element: RhxAskRedHatButton;
    it('imperatively instantiates', function() {
      expect(document.createElement('rhx-ask-red-hat-button')).to.be.an.instanceof(RhxAskRedHatButton);
    });

    it('should upgrade', async function() {
      element = await createFixture<RhxAskRedHatButton>(html`<rhx-ask-red-hat-button></rhx-ask-red-hat-button>`);
      const klass = customElements.get('rhx-ask-red-hat-button');
      expect(element)
        .to.be.an.instanceOf(klass)
        .and
        .to.be.an.instanceOf(RhxAskRedHatButton);
    });
  })
});
