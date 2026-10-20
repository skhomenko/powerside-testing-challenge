# Powerside testing challenge

Application: [Power Quality Monitor](https://testapp.andresfloresv.com)

- [Application inventory](docs/application-inventory.md)
- [Test strategy](docs/test-strategy.md)
- [Test suite and coverage](docs/test-cases.md)
- [Manual test report](docs/manual-test-report.md)
- [Reported findings](https://github.com/skhomenko/powerside-testing-challenge/issues)

## Setup

Install **Node 24.x**, npm and Google Chrome. If you use nvm:

```sh
nvm install
nvm use
```

Install dependencies and prepare the local configuration:

```sh
npm ci --ignore-scripts
npx cypress install
npx cypress verify
cp .env.example .env.local
chmod 600 .env.local
```

Set `POWERSIDE_USERNAME` and `POWERSIDE_PASSWORD` in `.env.local` to the supplied
test credentials. The application URL is already set in the example file.
`.env.local` is ignored by Git.

## Run the tests

```sh
npm run cy:open          # Interactive runner
npm run test:smoke       # Access and core page availability
npm run test:regression  # Automated regression suite (TC-01 through TC-06)
```

Run one spec or check JavaScript syntax:

```sh
npm run test:spec -- cypress/e2e/regression/devices.cy.js
npm run check
```

Headless runs use Chrome at 1440 x 900. The npm commands set the browser timezone
to `America/Toronto` for the date checks.

JUnit XML and `summary.json` reports are saved under `results/smoke/`,
`results/regression/` or `results/spec/`. Each command replaces its previous
reports and returns a nonzero exit code if the run does not pass.

The date tests currently reproduce known defects
[#8](https://github.com/skhomenko/powerside-testing-challenge/issues/8) and
[#17](https://github.com/skhomenko/powerside-testing-challenge/issues/17).
