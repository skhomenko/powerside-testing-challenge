import { devices } from '../../support/pages/devices';

describe('TC-03 | Devices availability [Smoke, Regression]', () => {
  beforeEach(() => cy.signIn());

  it('loads the primary page components', () => {
    devices.visit();
    devices.assertLoaded();
  });
});
