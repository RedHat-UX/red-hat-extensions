import { expect, html } from '@open-wc/testing';
import { createFixture } from '@patternfly/pfe-tools/test/create-fixture.js';
import { RhxAskRedHat } from '@rhdx/elements/rhx-ask-red-hat/rhx-ask-red-hat.js';

describe('<rhx-ask-red-hat>', function() {
  describe('simply instantiating', function() {
    let element: RhxAskRedHat;
    it('imperatively instantiates', function() {
      expect(document.createElement('rhx-ask-red-hat')).to.be.an.instanceof(RhxAskRedHat);
    });

    it('should upgrade', async function() {
      element = await createFixture<RhxAskRedHat>(html`<rhx-ask-red-hat></rhx-ask-red-hat>`);
      const klass = customElements.get('rhx-ask-red-hat');
      expect(element)
          .to.be.an.instanceOf(klass)
          .and
          .to.be
          .an.instanceOf(RhxAskRedHat);
    });
  });
});
