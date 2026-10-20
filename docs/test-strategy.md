# Test strategy

Focus on access, reliable monitoring data and finding the right device, event or alarm. Use a small Cypress suite for repeatable checks. Keep exploratory work focused on usability, unclear behavior and situations that are difficult to reproduce safely.

## Coverage decisions

| Risk | Coverage | Approach and reason |
| --- | --- | --- |
| Login fails or access remains after logout | TC-01, TC-10; access and error exploration | Automate login and logout. Check browser restart and session timing manually first; use API tests to investigate backend authorization. |
| Dashboard is unavailable or shows misleading data | TC-02; API reconciliation; chart exploration | Smoke checks loading and a device link. Verify counts through API tests once the source data and counting rules are understood. Review chart meaning and updates manually. |
| Filters, sorting or pagination hide records | TC-03 through TC-06 | Automate common combinations and date boundaries. These are frequent investigation tasks with clear expected results. |
| Settings or alarm actions affect unintended records | TC-07 through TC-09 | Manual first. Automation needs isolated data and reliable cleanup, including generated alarms. Restoring settings alone may leave side effects. |
| Controls are confusing, inaccessible or recover poorly from errors | Usability and error exploration | Explore keyboard access, layout, wording, validation and recovery. Automate repeatable findings once expectations are clear. |

## Selection and execution

Automate TC-01 through TC-06 with JavaScript and Cypress: access, Dashboard loading and navigation, Devices, Events, Alarms and dates. This covers normal workflows as well as known defects. Keep saved settings, alarm actions and longer session checks manual until their data and behavior are dependable.

**Smoke:** TC-01, TC-02 and page availability checks for TC-03 through TC-05. **Regression:** Smoke plus TC-03 through TC-10 and the exploratory sessions. Each case has one definition and can belong to both groups.

Complete the remaining manual checks before implementing the affected automation, or record why they cannot run. Use Smoke for quick feedback while developing Cypress tests, then finish with all implemented tests and the manual results. Record known defects as failures with issue links and missing prerequisites as Blocked. Improvements and unanswered product questions are not assumed requirements.

## Automated scope and limits

The Cypress suite implements TC-01 through TC-06. TC-07 through TC-10 and
exploratory sessions remain manual. See the [coverage table](test-cases.md#automated-coverage)
for implemented scenarios and the [README](../README.md#run-the-tests) for
execution commands and report locations.

The tests are read-only apart from login and logout. A request guard blocks
other browser writes on the application origin.

Expected totals and records assume backend data stays unchanged between
discovery and UI requests. Concurrent inserts, alarm resolutions or edits can
invalidate those comparisons.

## API candidates

The endpoints below were observed as resource URLs. Confirm request methods, response schemas, status codes and authentication before writing API tests.

| Observed endpoints | Proposed coverage | Confirm first |
| --- | --- | --- |
| `/api/auth/login`, `/api/auth/me` | Authentication and access after logout or timeout | Session behavior and expected responses |
| `/api/dashboard/summary`, `/api/devices`, `/api/events` | Dashboard counts against complete device and alarm records | Count definitions, pagination and a consistent data snapshot |
| `/api/events`, `/api/pq-events`, `/api/pq-events/scatter` | Dates, filter combinations, sorting, pagination and agreement between lists and charts | Timezone rules, parameters and schemas |
| `/api/devices/:id`, `/api/devices/:id/events` | Saved settings and related alarm history | Returned fields, save requests, permissions and effects on alarms |

**Global Alarms uses `/api/events`; power-quality Events uses `/api/pq-events`.** These URLs do not establish how changes are submitted. Use API tests for broader data combinations after verification, while Cypress covers the user workflows.

## Automation approach

Use readable JavaScript specs and small page objects for each page's actions and assertions. Share helpers and API clients only where useful. TC-01 signs in through the UI; other tests can use `cy.session()` to reuse a validated session. Tests must run independently.

Centralize the base URL, timezone and data configuration. Supply credentials through protected environment variables. Use stable semantic selectors or `data-cy`. Wait on aliased `cy.intercept()` requests and retryable UI assertions, without hardcoded waits.

Use the real backend for Smoke, filters, dates and saved-value checks. Use stubbed responses and synthetic fixtures for empty results, delays, malformed responses and errors after confirming response schemas. These tests check UI recovery, not backend behavior.

Select groups without duplicating specs. Report test IDs, results, failure details and issue links; JUnit output supports CI artifacts. Check screenshots and logs before sharing to exclude credentials and sensitive records.

Local Make commands and the Docker runner wrap the same npm scripts. Hosted
execution runs credential-free checks first, then Smoke on trusted `main`
runs. A manually requested full Regression run depends on successful Smoke.
Live workflows share a concurrency group to protect the shared account.
See the [README](../README.md#github-actions) for CI configuration and
[results and known failures](../README.md#results-and-known-failures) for report details.

Select data by relevant properties rather than historical counts, timestamps or device IDs. Settings and alarm tests need authorized isolated records and verified cleanup, including after failures. Check for concurrent edits before restoring settings.

## Deferred coverage

Contract tests are deferred because no API schema has been supplied or verified. Confirm the expected contracts before adding compatibility checks.

Load tests are deferred because an isolated environment, authorization and performance targets have not been established. Lightweight timings during exploration can provide an initial baseline.

Also defer exhaustive filter combinations, a broad browser and real-device matrix, a full accessibility review, complete chart and ITIC calculations, and a detailed security review of code, dependencies and deployment. Remaining risks include uncommon combinations, accessibility barriers, calculation errors, performance under load and unverified backend controls.
