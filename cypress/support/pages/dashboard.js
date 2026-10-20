export const dashboard = {
  visit() {
    cy.intercept('GET', '/api/dashboard/summary').as('summary');
    cy.intercept('GET', '/api/dashboard/recent-alarms*').as('recent');
    cy.intercept('GET', '/api/dashboard/live*').as('live');
    cy.visit('/');
    cy.wait(['@summary', '@recent', '@live']).each(({ response }) => {
      expect(response.statusCode, 'Dashboard request status').to.eq(200);
    });
  },
  assertLoaded() {
    cy.get('h1').should('have.text', 'Dashboard');
    ['Total devices', 'Active alarms', 'Devices out of spec', 'Offline devices'].forEach(title => {
      cy.contains('h3', title).should('be.visible').next().find('p').first().invoke('text').should('match', /^\d+$/);
    });
    cy.contains('h2', 'Live voltage').should('be.visible');
    cy.get('main svg.recharts-surface').should('be.visible');
    cy.contains('h2', 'Recent alarms').should('be.visible');
    cy.contains('Something went wrong').should('not.exist');
  },
};
