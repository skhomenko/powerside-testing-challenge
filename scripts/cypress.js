const fs = require('node:fs');
const path = require('node:path');

if (Number(process.versions.node.split('.')[0]) !== 24) {
  console.error('CONFIGURATION BLOCKER: use Node 24.x as specified in .nvmrc.');
  process.exit(2);
}

process.env.TZ = 'America/Toronto';
const [mode = 'regression', ...args] = process.argv.slice(2);
if (!['open', 'smoke', 'regression', 'spec'].includes(mode) || (mode === 'spec' && args.length !== 1) || (mode !== 'spec' && args.length)) {
  console.error('Usage: node scripts/cypress.js open|smoke|regression|spec <spec-path>');
  process.exit(2);
}
process.umask(0o077);
const { parseEnv } = require('node:util');
const local = fs.existsSync('.env.local') ? parseEnv(fs.readFileSync('.env.local', 'utf8')) : {};
const privateSettings = { ...local, ...process.env };
const secrets = [privateSettings.POWERSIDE_USERNAME, privateSettings.POWERSIDE_PASSWORD].filter(Boolean);
function redact(value) {
  let text = String(value);
  for (const secret of secrets) {
    const escaped = secret.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&apos;');
    text = text.split(escaped).join('[redacted]').split(secret).join('[redacted]');
  }
  return text;
}
function failureKind(message) {
  if (!message) return null;
  if (message.includes('Intended inclusive displayed-day boundaries') || message.includes('Intended To behavior')) return 'application-defect';
  if (message.includes('DATA BLOCKER:')) return 'data-blocker';
  if (message.includes('ENVIRONMENT BLOCKER:') || message.includes('CONFIGURATION BLOCKER:')) return 'environment-blocker';
  const listUnavailable = /(?:list request|discovery) status: expected 5\d{2} to equal 200/.test(message);
  const requestUnavailable = /cy\.(?:visit|request)\(\)/.test(message)
    && /(?:^|\n)\s*>\s*(?:5\d{2}\s*:|Bad Gateway\b)/m.test(message);
  if (listUnavailable || requestUnavailable) return 'environment-blocker';
  return 'investigate';
}
const cypress = require('cypress');
(async () => {
  if (mode === 'open') return cypress.open({ e2e: true, browser: 'chrome' });
  const directory = path.resolve('results', mode);
  fs.mkdirSync(directory, { recursive: true });
  // Replace only this group's generated reports, preserving other runs.
  for (const file of fs.readdirSync(directory)) {
    if (/^(junit-.*\.xml|summary\.json)$/.test(file)) fs.unlinkSync(path.join(directory, file));
  }
  const result = await cypress.run({
    e2e: true,
    quiet: true,
    browser: process.env.POWERSIDE_BROWSER || 'chrome',
    spec: mode === 'smoke' ? 'cypress/e2e/smoke/**/*.cy.js' : mode === 'spec' ? args[0] : undefined,
    reporter: 'junit',
    reporterOptions: { mochaFile: path.join(directory, 'junit-[hash].xml'), toConsole: false },
  });
  if (result.status === 'failed') {
    console.error(redact(`ENVIRONMENT BLOCKER: ${result.message || 'Cypress could not start. Review the configuration or browser error above.'}`));
    process.exitCode = 2;
    return;
  }
  const summary = {
    group: mode,
    started: result.startedTestsAt,
    ended: result.endedTestsAt,
    browser: { name: result.browserName, version: result.browserVersion },
    cypress: result.cypressVersion,
    node: process.version,
    timezone: process.env.TZ,
    viewport: { width: 1440, height: 900 },
    total: result.totalTests, passed: result.totalPassed, failed: result.totalFailed,
    pending: result.totalPending, skipped: result.totalSkipped,
    specs: result.runs.map(run => ({
      spec: run.spec.relative,
      tests: run.tests.map(test => ({
        title: test.title.join(' > '), state: test.state,
        failure: test.displayError || test.attempts.at(-1)?.error?.message || null,
        classification: failureKind(test.displayError || test.attempts.at(-1)?.error?.message),
      })),
    })),
  };
  fs.writeFileSync(path.join(directory, 'summary.json'), JSON.stringify(summary, (key, value) => typeof value === 'string' ? redact(value) : value, 2) + '\n', { mode: 0o600 });
  for (const file of fs.readdirSync(directory).filter(file => /^junit-.*\.xml$/.test(file))) {
    const report = path.join(directory, file);
    fs.writeFileSync(report, redact(fs.readFileSync(report, 'utf8')), { mode: 0o600 });
    fs.chmodSync(report, 0o600);
  }
  for (const test of summary.specs.flatMap(spec => spec.tests).filter(test => test.state !== 'passed')) {
    console.error(redact(`${test.classification || test.state}: ${test.title}\n${test.failure || 'No completed result.'}`));
  }
  console.log(`Results: ${summary.passed} passed, ${summary.failed} failed, ${summary.pending} pending, ${summary.skipped} skipped. Reports: results/${mode}/`);
  process.exitCode = summary.failed || summary.pending || summary.skipped || !summary.total ? 1 : 0;
})().catch(error => {
  // Avoid serializing configuration or error objects that may contain secrets.
  console.error(redact(`ENVIRONMENT BLOCKER: ${error.message || 'Cypress launch failed. Check Node 24, browser availability and npx cypress verify.'}`));
  process.exitCode = 2;
});
