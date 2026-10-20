import './commands';

beforeEach(() => {
  const origin = new URL(Cypress.config('baseUrl')).origin;
  cy.intercept({ url: `${origin}/**`, middleware: true }, req => {
    const pathname = new URL(req.url).pathname;
    // Keep the site's performance beacon local instead of sending telemetry during tests.
    if (req.method === 'POST' && pathname === '/cdn-cgi/rum') {
      req.reply({ statusCode: 204, log: false });
      return;
    }
    const auth = req.method === 'POST' && /^\/api\/auth\/(login|logout)$/.test(pathname);
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && !auth) {
      req.destroy();
      throw new Error(`SAFETY BLOCKER: a test attempted an unauthorized application mutation (${req.method} ${pathname}).`);
    }
  });
  cy.intercept('/api/auth/**', { log: false });
  cy.on('window:before:load', win => {
    const actual = win.Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (actual !== Cypress.expose('timezone')) {
      throw new Error(`ENVIRONMENT BLOCKER: browser timezone is ${actual}; expected ${Cypress.expose('timezone')}. Launch with TZ=America/Toronto.`);
    }
  });
});
