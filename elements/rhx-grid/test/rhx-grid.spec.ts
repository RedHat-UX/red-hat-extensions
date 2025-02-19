import { expect, html } from '@open-wc/testing';
import { createFixture } from '@patternfly/pfe-tools/test/create-fixture.js';
import { RhxGrid } from '@rhx/elements/rhx-grid/rhx-grid.js';

describe('<rhx-grid>', function() {
  describe('simply instantiating', function() {
    let element: RhxGrid;
    it('should upgrade', async function() {
      element = await createFixture<RhxGrid>(html`<rhx-grid></rhx-grid>`);
      const klass = customElements.get('rhx-grid');
      expect(element)
          .to.be.an.instanceOf(klass)
          .and
          .to.be.an.instanceOf(RhxGrid);
    });
  });
});
