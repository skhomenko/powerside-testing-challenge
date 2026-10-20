# Powerside testing challenge

Browser tests for [Power Quality Monitor](https://testapp.andresfloresv.com),
using JavaScript and Cypress.

- [Application inventory](docs/application-inventory.md)
- [Test strategy](docs/test-strategy.md)
- [Test suite and coverage](docs/test-cases.md)
- [Manual test report](docs/manual-test-report.md)
- [Reported findings](https://github.com/skhomenko/powerside-testing-challenge/issues)

## Setup

For local runs, install **Node 24.x**, npm and Google Chrome. With nvm, run
`nvm install` and `nvm use` to select the version in `.nvmrc`.

```sh
npm ci --ignore-scripts
npx cypress install
npx cypress verify
cp .env.example .env.local
chmod 600 .env.local
```

Set `POWERSIDE_USERNAME` and `POWERSIDE_PASSWORD` in `.env.local` to the supplied
test credentials. The application URL is already configured. `.env.local` is
ignored by Git. Environment variables override values in the file.

## Run the tests

```sh
npm run test:smoke       # Access and core page availability
npm run test:regression  # Full suite, including Smoke (TC-01 through TC-06)
npm run cy:open          # Interactive runner
npm run test:spec -- cypress/e2e/regression/alarms.cy.js
npm run check           # JavaScript syntax checks
```

Make shortcuts are also available: `make smoke`, `make regression`,
`make open` and `make check`. Run `make help` for all commands.

Tests use Chrome at 1440 x 900 with the `America/Toronto` timezone.
Run tests using the shared account one at a time, including local and CI runs.

## Docker

Requires Docker with a running Linux-container daemon and Make. Set up
`.env.local` as above; host Node and Chrome are not needed.

```sh
make build
make run-smoke
make run-regression
make run-spec SPEC=cypress/e2e/regression/alarms.cy.js
```

Rebuild after changing tests, configuration or dependencies. The image pins
Node, Cypress and Chrome versions. The commands use a POSIX shell; on Windows,
use WSL2.

## GitHub Actions

Pull requests and manual runs on other branches run static checks only.
Pushes to `main` also run Smoke. To run full Regression, manually dispatch
[Browser tests](.github/workflows/tests.yml) on `main` with `suite=regression`;
Regression runs after Smoke passes and includes the Smoke specs again.

Live runs require repository secrets `POWERSIDE_USERNAME` and
`POWERSIDE_PASSWORD`. The optional repository variable `POWERSIDE_BASE_URL`
overrides the application URL. JUnit and JSON reports are retained for 3 days.

## Results and known failures

Headless runs save JUnit XML and `summary.json` under `results/<group>/`
(`smoke`, `regression` or `spec`), replacing that group's previous reports.
A non-passing run returns a nonzero exit code.

The date tests currently reproduce known application defects
[#8](https://github.com/skhomenko/powerside-testing-challenge/issues/8) and
[#17](https://github.com/skhomenko/powerside-testing-challenge/issues/17).
The summary distinguishes these from data or environment blockers and failures
that need investigation. If startup fails without a summary, check the console
output. Inspect reports before sharing them outside the project.
