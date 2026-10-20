const { defineConfig } = require('cypress');
const fs = require('node:fs');
const { parseEnv } = require('node:util');

const local = fs.existsSync('.env.local') ? parseEnv(fs.readFileSync('.env.local', 'utf8')) : {};
const settings = { ...local, ...process.env };
const timezone = 'America/Toronto';
const { approvedOrigin } = require('./cypress/support/target');

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
    baseUrl: approvedOrigin,
    specPattern: 'cypress/e2e/**/*.cy.js',
    supportFile: 'cypress/support/e2e.js',
    testIsolation: true,
    setupNodeEvents(on, config) {
      let target;
      try {
        target = new URL(config.baseUrl);
      } catch {
        throw new Error('CONFIGURATION BLOCKER: baseUrl must be a valid URL on the approved application origin.');
      }
      if (target.origin !== approvedOrigin || target.username || target.password) {
        throw new Error(`CONFIGURATION BLOCKER: baseUrl must use the approved origin ${approvedOrigin}, without embedded credentials.`);
      }
      if (!config.env.username || !config.env.password) {
        throw new Error('CONFIGURATION BLOCKER: set POWERSIDE_USERNAME and POWERSIDE_PASSWORD privately.');
      }
      return config;
    },
  },
});
