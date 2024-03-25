import { pfeCustomElementsManifestConfig } from '@patternfly/pfe-tools/custom-elements-manifest/config.js';

export default pfeCustomElementsManifestConfig({
  globs: ['elements/*/rhx-*.ts', 'elements/*/Rh*.ts'],
  exclude: ['*.css.js'],
});

