// cy.request bypasses browser interception. Keep its authorization boundary here.
const { approvedOrigin } = require('./target');
const reads = new Set(['/api/auth/me', '/api/dashboard/summary', '/api/devices', '/api/events']);

export function api(path, { method = 'GET', qs, body } = {}) {
  const url = new URL(path, Cypress.config('baseUrl'));
  const auth = method === 'POST' && ['/api/auth/login', '/api/auth/logout'].includes(url.pathname);
  const read = method === 'GET' && reads.has(url.pathname);
  if (url.origin !== approvedOrigin || url.username || url.password || url.search || url.hash
    || !(read || auth)) {
    throw new Error('SAFETY BLOCKER: API request is outside the authorized origin, paths or methods.');
  }
  return cy.request({
    url: url.href, method, qs, body, log: false,
    followRedirect: false, failOnStatusCode: false,
    retryOnNetworkFailure: false, retryOnStatusCodeFailure: false, timeout: 30000,
  }).then(response => {
    if (response.status >= 500) throw new Error(`ENVIRONMENT BLOCKER: API returned HTTP ${response.status}.`);
    return response;
  });
}

export function protectApiDiagnostics() {
  // Native request diagnostics include automatically attached cookies and request bodies.
  cy.on('fail', error => {
    if (/cy\.request|CypressError/.test(`${error.name} ${error.message}`)) {
      throw new Error('ENVIRONMENT BLOCKER: API request could not complete; private transport diagnostics suppressed.');
    }
    throw error;
  });
}

export function apiLogin() {
  return cy.clearAllCookies({ log: false }).then(() =>
    cy.env(['username', 'password'], { log: false }).then(credentials =>
      api('/api/auth/login', { method: 'POST', body: credentials }).then(({ status, body }) => {
        expect(status, 'API login status').to.eq(200);
        expect(body?.user, 'API login supplies a user').to.exist;
        expect(typeof body.user, 'API login user type').to.eq('object');
      })));
}

export function apiLogout() {
  return api('/api/auth/logout', { method: 'POST' }).then(({ status, body }) => {
    expect(status, 'client logout status').to.eq(200);
    expect(body?.ok, 'logout acknowledgement').to.eq(true);
  });
}

export function cleanupApiSession(test) {
  const alreadyFailed = test.state === 'failed';
  const preserveFailure = () => false;
  if (alreadyFailed) {
    // Ignore only this cleanup failure; the original test stays failed.
    cy.removeAllListeners('fail');
    cy.once('fail', preserveFailure);
  }
  return api('/api/auth/logout', { method: 'POST' }).then(() => {
    if (alreadyFailed) {
      cy.removeListener('fail', preserveFailure);
      protectApiDiagnostics();
    }
  });
}

export function denied(path) {
  return api(path).then(({ status, body }) => {
    expect(status, 'protected request without credential').to.eq(401);
    expect(typeof body?.error, 'access error is text, not protected records').to.eq('string');
    expect(body.error.length, 'access error is not empty').to.be.greaterThan(0);
    expect(Object.keys(body).sort(), 'no protected fields returned').to.deep.eq(['error']);
  });
}

export function get(path, qs) {
  return api(path, { qs }).then(({ status, body }) => {
    expect(status, 'authenticated API status').to.eq(200);
    return body;
  });
}

export function list(path, key, qs = {}) {
  return get(path, { page: 1, pageSize: 1, ...qs }).then(body => {
    const collectionType = Array.isArray(body[key]) ? 'array' : typeof body[key];
    expect(collectionType, `${key} collection type`).to.eq('array');
    ['total', 'page', 'pageSize', 'totalPages'].forEach(field => {
      expect(typeof body[field], `pagination ${field} type`).to.eq('number');
      expect(body[field], `pagination ${field} must be a safe integer`).to.satisfy(Number.isSafeInteger);
      expect(body[field], `pagination ${field} must be nonnegative`).to.be.at.least(0);
    });
    expect(body.page, 'requested page').to.eq(qs.page || 1);
    expect(body.pageSize, 'requested page size').to.eq(qs.pageSize || 1);
    const expectedPages = Math.max(1, Math.ceil(body.total / body.pageSize));
    const offset = (body.page - 1) * body.pageSize;
    const remaining = Math.max(0, body.total - offset);
    const expectedLength = Math.min(body.pageSize, remaining);
    expect(body.totalPages, 'page count agrees with total').to.eq(expectedPages);
    expect(body[key].length, 'page length agrees with total').to.eq(expectedLength);
    return body;
  });
}

export function allDevices(page = 1, records = [], total) {
  return list('/api/devices', 'devices', { page, pageSize: 100, sort: 'name', order: 'asc' }).then(body => {
    if (total !== undefined && total !== body.total) throw new Error('DATA BLOCKER: device total changed during discovery.');
    const combined = records.concat(body.devices);
    if (combined.length < body.total) {
      if (page >= 10 || !body.devices.length) throw new Error('DATA BLOCKER: device discovery exceeded ten pages or stopped early.');
      return allDevices(page + 1, combined, body.total);
    }
    expect(new Set(combined.map(d => d.id)).size, 'unique device identities').to.eq(combined.length);
    return combined;
  });
}

export function deviceState(records) {
  return records.map(d => [d.id, d.name, d.status, d.active_alarms]).sort((a, b) => a[0] - b[0]);
}
