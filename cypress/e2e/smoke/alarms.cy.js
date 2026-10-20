import { alarms } from '../../support/pages/alarms';

describe('TC-05 | Alarms availability [Smoke, Regression]', () => {
  beforeEach(() => cy.signIn());

  it('loads the primary page components', () => {
    alarms.visit();
    alarms.assertLoaded();
  });
});
