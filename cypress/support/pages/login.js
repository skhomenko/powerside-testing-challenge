export const login = {
  visit() {
    cy.visit('/login');
    cy.location('pathname').should('eq', '/login');
  },
  assertLoaded() {
    cy.get('h1').should('be.visible').and('have.text', 'Power Quality Monitor');
    cy.get('#username').should('be.visible').and('have.attr', 'required');
    cy.get('#password').should('be.visible').and('have.attr', 'type', 'password');
    cy.get('#password').should('have.attr', 'required');
    cy.get('button[type="submit"]').should('be.visible').and('have.text', 'Log In');
  },
  submitValid() {
    cy.location('origin').should('eq', new URL(Cypress.config('baseUrl')).origin);
    cy.intercept('POST', '/api/auth/login').as('login');
    cy.env(['username', 'password'], { log: false }).then(({ username, password }) => {
      cy.get('#username', { log: false }).type(username, { log: false });
      cy.get('#password', { log: false }).type(password, { log: false });
      cy.get('button[type="submit"]', { log: false }).click({ log: false });
    });
    cy.wait('@login', { log: false }).then(({ response }) => {
      expect(response?.statusCode, 'login status').to.eq(200);
    });
    cy.location('pathname').should('eq', '/');
    cy.get('h1').should('have.text', 'Dashboard');
  },
  logout() {
    cy.intercept('POST', '/api/auth/logout').as('logout');
    cy.get('header button[aria-haspopup="menu"]').click();
    cy.contains('[role="menuitem"]', /^Log out$/i).click();
    cy.wait('@logout', { log: false });
    cy.location('pathname').should('eq', '/login');
  },
};
