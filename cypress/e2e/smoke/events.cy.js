import { events } from '../../support/pages/events';

describe('TC-04 | Events availability [Smoke, Regression]', () => {
  beforeEach(() => cy.signIn());

  it('loads the primary page components', () => {
    events.visit();
    events.assertLoaded();
  });
});
