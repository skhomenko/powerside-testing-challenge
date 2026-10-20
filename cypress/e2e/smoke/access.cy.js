import { login } from '../../support/pages/login';

describe('TC-01 | access [Smoke, Regression]', () => {
  const requiredFieldCases = [
    { name: 'both fields empty', username: '', password: '' },
    { name: 'the password empty', username: 'required-field-check', password: '' },
    { name: 'the username empty', username: '', password: 'required-field-check' },
  ];

  for (const { name, username, password } of requiredFieldCases) {
    it(`blocks submission with ${name}`, () => {
      login.visit();
      login.assertLoaded();
      if (username) cy.get('#username').type(username);
      if (password) cy.get('#password').type(password, { log: false });
      cy.get('button[type="submit"]').should('be.disabled');
    });
  }

  it('signs in through the UI, survives reload, signs out and protects navigation', () => {
    login.visit();
    login.assertLoaded();
    login.submitValid();
    cy.request({ url: '/api/devices', qs: { pageSize: 1 }, log: false }).then(({ status, body }) => {
      expect(status).to.eq(200);
      expect(body.devices.length, 'DATA BLOCKER: a device is required').to.be.greaterThan(0);
      const devicePath = `/devices/${body.devices[0].id}`;
      cy.reload();
      cy.get('h1').should('have.text', 'Dashboard');
      cy.visit(devicePath);
      cy.get('h1').should('have.text', body.devices[0].name);
      login.logout();
      cy.go('back');
      cy.location('pathname').should('eq', '/login');
      cy.get('main').should('not.exist');
      [devicePath, '/alarms', '/events', '/'].forEach(url => {
        cy.visit(url);
        cy.location('pathname').should('eq', '/login');
        cy.get('[data-cy="device-row"], [data-cy="alarm-row"], [data-cy="pq-event-row"]').should('not.exist');
      });
    });
  });
});
