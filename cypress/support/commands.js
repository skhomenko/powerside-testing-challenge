import { login } from './pages/login';

Cypress.Commands.add('signIn', () => {
  cy.session('operator-ui', () => {
    login.visit();
    login.submitValid();
  }, {
    validate() {
      cy.request({ url: '/api/auth/me', log: false, failOnStatusCode: false }).then(({ status, body }) => {
        expect(status, 'validated session status').to.eq(200);
        expect(Boolean(body.user), 'authenticated user exists').to.eq(true);
      });
    },
  });
});
