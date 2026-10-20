# Powerside testing challenge

Browser tests for [Power Quality Monitor](https://testapp.andresfloresv.com),
using JavaScript and Cypress.

- [Application inventory](docs/application-inventory.md)
- [Test strategy](docs/test-strategy.md)
- [Test suite and coverage](docs/test-cases.md)
- [Manual test report](docs/manual-test-report.md)
- [Reported findings](https://github.com/skhomenko/powerside-testing-challenge/issues)

## Setup

After cloning, prepare the private configuration:

```sh
cp .env.example .env.local
chmod 600 .env.local
```

Set `POWERSIDE_USERNAME` and `POWERSIDE_PASSWORD` in `.env.local` to the supplied
test credentials. The application URL is already configured. `.env.local` is
ignored by Git. Environment variables override values in the file.

### Docker (recommended)

Requires Docker with a running Linux-container daemon and a POSIX shell
(use WSL2 on Windows). Host Node, npm and Chrome are not needed.

```sh
sh scripts/docker.sh build
sh scripts/docker.sh smoke
sh scripts/docker.sh regression
sh scripts/docker.sh spec cypress/e2e/regression/alarms.cy.js
```

With Make installed, the equivalents are `make build`, `make run-smoke` and
`make run-regression`. Rebuild after changing tests, configuration or dependencies.
The image pins Node, Cypress and Chrome versions.

### Local alternative

Requires **Node 24.x**, npm and Google Chrome. If you use nvm:

```sh
nvm install
nvm use
```

Without nvm, install Node 24.x and confirm `node --version` shows `v24.x` before
continuing. `.nvmrc` records the requirement; it does not switch Node automatically.

```sh
npm ci --ignore-scripts
npx cypress install
npx cypress verify
```

## Run the tests

These commands are for local runs. For Docker, use the commands in Setup above.

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
Automated tests are verified in Chrome only. Cross-browser coverage is outside
the scope of this submission.
Run tests using the shared account one at a time, including local and CI runs.

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
Check `summary.json` for failure details. If the tests fail to start, check the
terminal output.
