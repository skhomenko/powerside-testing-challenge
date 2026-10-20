import { apiLogin, apiLogout, cleanupApiSession, denied, get, protectApiDiagnostics } from '../../support/api';

describe('API-01 | Authentication and protected access', () => {
  beforeEach(() => {
    protectApiDiagnostics();
    cy.clearAllCookies({ log: false });
  });

  afterEach(function () {
    return cleanupApiSession(this.currentTest);
  });

  const protectedEndpoints = ['/api/auth/me', '/api/devices', '/api/events', '/api/dashboard/summary'];
  for (const endpoint of protectedEndpoints) {
    it(`rejects unauthenticated GET ${endpoint} without protected fields`, () => {
      denied(endpoint);
    });
  }

  it('logs in through the API and removes client access on logout', () => {
    apiLogin();
    get('/api/auth/me').then(body => {
      expect(body?.user, 'authenticated user exists').to.exist;
      expect(typeof body.user, 'authenticated user type').to.eq('object');
    });
    get('/api/devices', { page: 1, pageSize: 1 }).then(body => {
      expect(Array.isArray(body.devices), 'authenticated device collection').to.eq(true);
    });
    apiLogout();
    // Do not clear cookies here: the server's logout response must remove client access.
    ['/api/auth/me', '/api/devices', '/api/dashboard/summary'].forEach(denied);
  });
});
