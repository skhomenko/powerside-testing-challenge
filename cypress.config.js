const { defineConfig } = require('cypress');
const fs = require('node:fs');
const { parseEnv } = require('node:util');

const local = fs.existsSync('.env.local') ? parseEnv(fs.readFileSync('.env.local', 'utf8')) : {};
const settings = { ...local, ...process.env };
const timezone = 'America/Toronto';

module.exports = defineConfig({
  viewportWidth: 1440,
  viewportHeight: 900,
  video: false,
  screenshotOnRunFailure: false,
  numTestsKeptInMemory: 0,
  retries: 0,
  defaultCommandTimeout: 10000,
  requestTimeout: 15000,
  responseTimeout: 30000,
  env: {
    username: settings.POWERSIDE_USERNAME,
    password: settings.POWERSIDE_PASSWORD,
  },
  expose: { timezone },
  e2e: {
    baseUrl: settings.POWERSIDE_BASE_URL || 'https://testapp.andresfloresv.com',
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    testIsolation: true,
    setupNodeEvents(on, config) {
      if (!config.env.username || !config.env.password) {
        throw new Error('CONFIGURATION BLOCKER: set POWERSIDE_USERNAME and POWERSIDE_PASSWORD privately.');
      }
      const target = new URL(config.baseUrl);
      if (target.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(target.hostname)) {
        throw new Error('CONFIGURATION BLOCKER: credentials require HTTPS, except for localhost.');
      }
      return config;
    },
  },
});
