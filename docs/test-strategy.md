# Test strategy

Focus on access, reliable monitoring data and finding the right device, event or alarm. Use a small Cypress suite for repeatable checks. Keep exploratory work focused on usability, unclear behavior and situations that are difficult to reproduce safely.

## Coverage decisions

| Risk | Coverage | Approach and reason |
| --- | --- | --- |
| Login fails or access remains after logout | TC-01, TC-10, API-01; access and error exploration | Automate login and logout. Check browser restart and session timing manually first; API-01 verifies protected access and client logout. See the [open session observation](test-report.md#session-revocation). |
| Dashboard is unavailable or shows misleading data | TC-02, API-02; chart exploration | Smoke checks loading and a device link. Reconcile counts against device records and filtered alarm totals. Review chart meaning and updates manually. |
| Filters, sorting or pagination hide records | TC-03 through TC-06 | Automate common combinations and date boundaries. These are frequent investigation tasks with clear expected results. |
| Settings or alarm actions affect unintended records | TC-07 through TC-09 | Manual first. Automation needs isolated data and reliable cleanup, including generated alarms. Restoring settings alone may leave side effects. |
| Controls are confusing, inaccessible or recover poorly from errors | Usability and error exploration | Explore keyboard access, layout, wording, validation and recovery. Automate repeatable findings once expectations are clear. |

## Selection and execution

Automate TC-01 through TC-06 with JavaScript and Cypress: access, Dashboard loading and navigation, Devices, Events, Alarms and dates. This covers normal workflows as well as known defects. Keep saved settings, alarm actions and longer session checks manual until their data and behavior are dependable.

API-01 through API-03 add independent access, Dashboard reconciliation and
representative backend pagination checks to full Regression.

**Smoke:** TC-01, TC-02 and page availability checks for TC-03 through TC-05. **Regression:** Smoke plus TC-03 through TC-10 and the exploratory sessions. Each case has one definition and can belong to both groups.

Complete the remaining manual checks before implementing the affected automation, or record why they cannot run. Use Smoke for quick feedback while developing Cypress tests, then finish with all implemented tests and the manual results. Record known defects as failures with issue links and missing prerequisites as Blocked. Improvements and unanswered product questions are not assumed requirements.

## Automated scope and limits

The Cypress suite implements TC-01 through TC-06 and API-01 through API-03.
TC-07 through TC-10 and exploratory sessions remain manual. See the [coverage table](test-cases.md#automated-coverage)
for implemented scenarios and the [README](../README.md#run-the-tests) for
execution commands and report locations.

The tests are read-only apart from login and logout. A request guard blocks
other browser writes on the application origin. API requests use a separate
origin/path/method allowlist because interception does not protect `cy.request()`.

Expected totals and records assume backend data stays unchanged between
discovery and UI requests. Concurrent inserts, alarm resolutions or edits can
invalidate those comparisons.

## API behavior and limits

Observed using the supplied account; no formal API contract was provided:

- **Access:** `POST /api/auth/login` issues an HttpOnly, SameSite=Lax session
  cookie; `GET /api/auth/me` returns `user`. Protected requests without a
  credential return 401 with only an `error` field.
- **Logout:** API-01 verifies client access removal. All API specs share
  assertion-free logout cleanup; cleanup errors preserve an existing failure. See the [session observation](test-report.md#session-revocation) for
  the unresolved backend expectation.
- **Counts:** Dashboard alarm totals include only `Active` alarms, excluding
  `Acknowledged` and `Resolved`. Critical, Warning and Info totals match
  `activeBySeverity`; zero severity totals are valid. Per-device Active totals
  match `active_alarms`.
  Devices out of spec means distinct devices with at least one Active alarm;
  offline devices have status `Offline`.
- **Lists:** `/api/events` contains alarms; `/api/pq-events` contains power-quality
  Events. Alarm status/severity/device filters, device status filtering and name
  sorting were checked against matching records and pagination totals. Empty lists
  report one total page.

Reconciliation compares independent endpoints without downloading alarm history.
Summary and device reads bracket the comparison. Changed counts allow one fresh
attempt, then a DATA BLOCKER; stable mismatches fail assertions. Separate
requests can miss changes that revert or preserve aggregate totals.

Requests are bounded: device discovery allows ten 100-row pages, reconciliation
covers at most 100 devices, alarm count queries retrieve one record, and device
status partitions allow 100 rows. Missing matching/nonmatching witnesses,
exceeded bounds and detected instability are blockers, never silent passes.
See [API coverage](test-cases.md#api-coverage) for individual scenarios.

Requests neither follow redirects nor retry transport failures. HTTP 5xx and
transport errors are environment blockers; unexpected statuses, fields and
stable mismatches require application investigation. Transport diagnostics are
suppressed; reports retain credential redaction, private permissions and upload
gating. Full response snapshots are not saved.

See the [test report](test-report.md#automated-verification) for results
and the security assessment.

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

Automated tests are verified in Chrome only. Once the supported browsers are
confirmed, extend Smoke coverage to a second browser before expanding the full
regression suite.

Contract tests are deferred because no API schema has been supplied or verified. Confirm the expected contracts before adding compatibility checks.

Load tests are deferred because an isolated environment, authorization and performance targets have not been established. Lightweight timings during exploration can provide an initial baseline.

Also defer exhaustive filter combinations, a broad browser and real-device matrix, a full accessibility review, complete chart and ITIC calculations, and a detailed security review of code, dependencies and deployment. Remaining risks include uncommon combinations, accessibility barriers, calculation errors, performance under load and unverified backend controls.
