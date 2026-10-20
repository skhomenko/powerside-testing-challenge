import { dashboard } from '../../support/pages/dashboard';

describe('TC-02 | Dashboard [Smoke, Regression]', () => {
  beforeEach(() => cy.signIn());

  it('loads monitoring sections and opens exactly the selected device', () => {
    dashboard.visit();
    dashboard.assertLoaded();
    cy.get('main a[href^="/devices/"]').should('have.length.at.least', 1).first().then($link => {
      const name = $link.text().trim();
      const href = $link.attr('href');
      cy.intercept('GET', `/api${href}`).as('device');
      cy.wrap($link).click();
      cy.wait('@device').its('response.statusCode').should('eq', 200);
      cy.location('pathname').should('eq', href);
      cy.get('h1').should('have.text', name);
    });
  });
});
